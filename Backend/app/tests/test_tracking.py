"""
Tests for Ambulance Tracking Router
------------------------------------
Tests REST API endpoints for ambulance GPS tracking and route information.
"""

import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ambulance import AmbulanceService
from app.models.ambulance_location_update import AmbulanceLocationUpdate
from app.models.emergency_request import EmergencyRequest
from app.models.user import User
from app.routers.tracking import (
    update_ambulance_location,
    get_tracking_data,
    LocationUpdateRequest,
)


# ─── Fixtures ─────────────────────────────────────────────────────


@pytest.fixture
def mock_db():
    """Mock database session."""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def ambulance_user():
    """Mock ambulance user."""
    return User(
        id=uuid4(),
        email="ambulance@test.com",
        role="ambulance",
        name="Test Ambulance User"
    )


@pytest.fixture
def patient_user():
    """Mock patient user."""
    return User(
        id=uuid4(),
        email="patient@test.com",
        role="patient",
        name="Test Patient"
    )


@pytest.fixture
def ambulance_service(ambulance_user):
    """Mock ambulance service."""
    return AmbulanceService(
        id=uuid4(),
        user_id=ambulance_user.id,
        name="Test Ambulance",
        phone="1234567890",
        vehicle_type="Type A",
        lat=-6.2088,
        lng=106.8456
    )


@pytest.fixture
def emergency_request(patient_user, ambulance_service):
    """Mock emergency request."""
    return EmergencyRequest(
        id=uuid4(),
        user_id=patient_user.id,
        ambulance_service_id=ambulance_service.id,
        status="on_my_way",
        location_lat=-6.2000,
        location_lng=106.8000,
        location_address="Test Address",
        created_at=datetime.now(timezone.utc)
    )


# ─── Tests: update_ambulance_location ─────────────────────────────


@pytest.mark.asyncio
async def test_update_location_success(mock_db, ambulance_user, ambulance_service, emergency_request):
    """Test successful location update."""
    # Setup mocks
    mock_db.execute.return_value.scalar_one_or_none.side_effect = [
        ambulance_service,
        emergency_request
    ]
    
    location_data = LocationUpdateRequest(
        emergency_request_id=str(emergency_request.id),
        lat=-6.2100,
        lng=106.8500,
        accuracy=10.0,
        speed=60.0,
        heading=90.0
    )
    
    # Mock routing service
    with patch('app.routers.tracking.routing_service') as mock_routing:
        mock_routing.__aenter__.return_value.calculate_route = AsyncMock(return_value={
            "distance_km": 5.2,
            "duration_minutes": 8.5,
            "coordinates": [[106.8500, -6.2100], [106.8000, -6.2000]]
        })
        mock_routing.__aenter__.return_value.calculate_eta = MagicMock(return_value={
            "minutes_remaining": 8,
            "estimated_arrival": datetime.now(timezone.utc)
        })
        
        # Mock tracking manager
        with patch('app.routers.tracking.tracking_manager') as mock_manager:
            mock_manager.broadcast_location_update = AsyncMock()
            
            result = await update_ambulance_location(
                location_data=location_data,
                db=mock_db,
                current_user=ambulance_user
            )
    
    assert result.success is True
    assert result.emergency_request_id == str(emergency_request.id)
    assert result.distance_remaining_km == 5.2
    assert result.eta_minutes == 8
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_location_unauthorized_role(mock_db, patient_user):
    """Test location update with non-ambulance user."""
    location_data = LocationUpdateRequest(
        emergency_request_id=str(uuid4()),
        lat=-6.2100,
        lng=106.8500
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await update_ambulance_location(
            location_data=location_data,
            db=mock_db,
            current_user=patient_user
        )
    
    assert exc_info.value.status_code == 403
    assert "ambulance" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_update_location_wrong_ambulance(mock_db, ambulance_user, ambulance_service, emergency_request):
    """Test location update for emergency assigned to different ambulance."""
    # Setup: emergency assigned to different ambulance
    other_ambulance_id = uuid4()
    emergency_request.ambulance_service_id = other_ambulance_id
    
    mock_db.execute.return_value.scalar_one_or_none.side_effect = [
        ambulance_service,
        emergency_request
    ]
    
    location_data = LocationUpdateRequest(
        emergency_request_id=str(emergency_request.id),
        lat=-6.2100,
        lng=106.8500
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await update_ambulance_location(
            location_data=location_data,
            db=mock_db,
            current_user=ambulance_user
        )
    
    assert exc_info.value.status_code == 403
    assert "tidak ditugaskan" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_update_location_invalid_status(mock_db, ambulance_user, ambulance_service, emergency_request):
    """Test location update for emergency with invalid status."""
    emergency_request.status = "completed"
    
    mock_db.execute.return_value.scalar_one_or_none.side_effect = [
        ambulance_service,
        emergency_request
    ]
    
    location_data = LocationUpdateRequest(
        emergency_request_id=str(emergency_request.id),
        lat=-6.2100,
        lng=106.8500
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await update_ambulance_location(
            location_data=location_data,
            db=mock_db,
            current_user=ambulance_user
        )
    
    assert exc_info.value.status_code == 400
    assert "status" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_update_location_routing_timeout(mock_db, ambulance_user, ambulance_service, emergency_request):
    """Test location update when routing service times out."""
    mock_db.execute.return_value.scalar_one_or_none.side_effect = [
        ambulance_service,
        emergency_request
    ]
    
    location_data = LocationUpdateRequest(
        emergency_request_id=str(emergency_request.id),
        lat=-6.2100,
        lng=106.8500
    )
    
    # Mock routing service timeout
    with patch('app.routers.tracking.routing_service') as mock_routing:
        mock_routing.__aenter__.return_value.calculate_route = AsyncMock(
            side_effect=TimeoutError()
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await update_ambulance_location(
                location_data=location_data,
                db=mock_db,
                current_user=ambulance_user
            )
        
        assert exc_info.value.status_code == 504


# ─── Tests: get_tracking_data ─────────────────────────────────────


@pytest.mark.asyncio
async def test_get_tracking_data_success(mock_db, patient_user, ambulance_service, emergency_request):
    """Test successful retrieval of tracking data."""
    location_update = AmbulanceLocationUpdate(
        ambulance_service_id=ambulance_service.id,
        emergency_request_id=emergency_request.id,
        lat=-6.2100,
        lng=106.8500,
        speed=60.0,
        heading=90.0,
        timestamp=datetime.now(timezone.utc)
    )
    
    mock_db.execute.return_value.scalar_one_or_none.side_effect = [
        emergency_request,
        ambulance_service,
        location_update
    ]
    
    # Mock routing service
    with patch('app.routers.tracking.routing_service') as mock_routing:
        mock_routing.__aenter__.return_value.calculate_route = AsyncMock(return_value={
            "distance_km": 5.2,
            "duration_minutes": 8.5,
            "coordinates": [[106.8500, -6.2100], [106.8000, -6.2000]]
        })
        mock_routing.__aenter__.return_value.calculate_eta = MagicMock(return_value={
            "minutes_remaining": 8,
            "estimated_arrival": datetime.now(timezone.utc)
        })
        
        result = await get_tracking_data(
            emergency_request_id=str(emergency_request.id),
            db=mock_db,
            current_user=patient_user
        )
    
    assert result.emergency_request_id == str(emergency_request.id)
    assert result.status == emergency_request.status
    assert result.ambulance is not None
    assert result.route is not None
    assert result.ambulance.current_lat == location_update.lat
    assert result.route.distance_km == 5.2


@pytest.mark.asyncio
async def test_get_tracking_data_patient_unauthorized(mock_db, patient_user, emergency_request):
    """Test patient accessing another patient's emergency."""
    other_patient_id = uuid4()
    emergency_request.user_id = other_patient_id
    
    mock_db.execute.return_value.scalar_one_or_none.return_value = emergency_request
    
    with pytest.raises(HTTPException) as exc_info:
        await get_tracking_data(
            emergency_request_id=str(emergency_request.id),
            db=mock_db,
            current_user=patient_user
        )
    
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_get_tracking_data_ambulance_access(mock_db, ambulance_user, ambulance_service, emergency_request):
    """Test ambulance accessing assigned emergency."""
    mock_db.execute.return_value.scalar_one_or_none.side_effect = [
        emergency_request,
        ambulance_service,
        ambulance_service,
        None  # No location updates yet
    ]
    
    result = await get_tracking_data(
        emergency_request_id=str(emergency_request.id),
        db=mock_db,
        current_user=ambulance_user
    )
    
    assert result.emergency_request_id == str(emergency_request.id)
    assert result.ambulance is not None
    assert result.ambulance.current_lat == ambulance_service.lat


@pytest.mark.asyncio
async def test_get_tracking_data_not_found(mock_db, patient_user):
    """Test retrieving non-existent emergency."""
    mock_db.execute.return_value.scalar_one_or_none.return_value = None
    
    with pytest.raises(HTTPException) as exc_info:
        await get_tracking_data(
            emergency_request_id=str(uuid4()),
            db=mock_db,
            current_user=patient_user
        )
    
    assert exc_info.value.status_code == 404
