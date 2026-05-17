"""
Ambulance Live Tracking Router
-------------------------------
Provides REST API endpoints for ambulance GPS tracking and route information.
Integrates with OSRM routing service and WebSocket tracking manager.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.ambulance import AmbulanceService
from app.models.ambulance_location_update import AmbulanceLocationUpdate
from app.models.emergency_request import EmergencyRequest as EmergencyRequestRecord
from app.models.user import User
from app.services.routing_service import routing_service
from app.Websocket.tracking_manager import tracking_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tracking", tags=["Tracking"])


# ─── Schemas ──────────────────────────────────────────────────────

class LocationUpdateRequest(BaseModel):
    """Request schema for ambulance location updates."""
    emergency_request_id: str = Field(..., description="Emergency request ID being tracked")
    lat: float = Field(..., ge=-90, le=90, description="Current latitude")
    lng: float = Field(..., ge=-180, le=180, description="Current longitude")
    accuracy: Optional[float] = Field(None, ge=0, description="GPS accuracy in meters")
    speed: Optional[float] = Field(None, ge=0, description="Current speed in km/h")
    heading: Optional[float] = Field(None, ge=0, lt=360, description="Heading in degrees (0-359)")


class LocationUpdateResponse(BaseModel):
    """Response schema for location update confirmation."""
    success: bool
    message: str
    emergency_request_id: str
    distance_remaining_km: float
    eta_minutes: int
    timestamp: datetime


class AmbulanceInfo(BaseModel):
    """Ambulance information for tracking response."""
    id: str
    name: str
    phone: Optional[str]
    vehicle_type: Optional[str]
    current_lat: float
    current_lng: float
    speed: Optional[float]
    heading: Optional[float]
    last_update: datetime


class PatientLocation(BaseModel):
    """Patient location information."""
    lat: float
    lng: float
    address: Optional[str]


class RouteInfo(BaseModel):
    """Route information between ambulance and patient."""
    distance_km: float
    duration_minutes: float
    coordinates: list  # List of [lng, lat] pairs for route polyline
    eta_minutes: int
    estimated_arrival: datetime


class TrackingDataResponse(BaseModel):
    """Complete tracking data response."""
    emergency_request_id: str
    status: str
    patient_location: PatientLocation
    ambulance: Optional[AmbulanceInfo]
    route: Optional[RouteInfo]
    last_updated: datetime


# ─── Helper Functions ─────────────────────────────────────────────

async def get_ambulance_for_user(
    db: AsyncSession,
    user: User
) -> AmbulanceService:
    """
    Get the ambulance service associated with the current user.
    
    Args:
        db: Database session
        user: Current authenticated user
        
    Returns:
        AmbulanceService instance
        
    Raises:
        HTTPException: If user is not an ambulance or ambulance not found
    """
    if user.role != "ambulance":
        raise HTTPException(
            status_code=403,
            detail="Hanya akun ambulance yang dapat mengupdate lokasi"
        )
    
    result = await db.execute(
        select(AmbulanceService).where(AmbulanceService.user_id == user.id)
    )
    ambulance = result.scalar_one_or_none()
    
    if not ambulance:
        raise HTTPException(
            status_code=404,
            detail="Layanan ambulance tidak ditemukan untuk user ini"
        )
    
    return ambulance


async def get_emergency_request(
    db: AsyncSession,
    emergency_request_id: str
) -> EmergencyRequestRecord:
    """
    Get emergency request by ID.
    
    Args:
        db: Database session
        emergency_request_id: Emergency request UUID string
        
    Returns:
        EmergencyRequestRecord instance
        
    Raises:
        HTTPException: If request not found or invalid ID format
    """
    try:
        request_uuid = uuid.UUID(emergency_request_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Format ID permintaan darurat tidak valid"
        )
    
    result = await db.execute(
        select(EmergencyRequestRecord).where(EmergencyRequestRecord.id == request_uuid)
    )
    emergency_request = result.scalar_one_or_none()
    
    if not emergency_request:
        raise HTTPException(
            status_code=404,
            detail="Permintaan darurat tidak ditemukan"
        )
    
    return emergency_request


# ─── Endpoints ────────────────────────────────────────────────────

@router.patch("/ambulances/location", response_model=LocationUpdateResponse)
async def update_ambulance_location(
    location_data: LocationUpdateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update ambulance GPS location during emergency response.
    
    This endpoint:
    1. Validates the ambulance user and emergency request
    2. Stores the location update in the database
    3. Calculates route and ETA using OSRM
    4. Broadcasts location update via WebSocket to all tracking clients
    
    Args:
        location_data: GPS location and metadata
        db: Database session
        current_user: Authenticated ambulance user
        
    Returns:
        LocationUpdateResponse with route info and ETA
    """
    # Get ambulance service for current user
    ambulance = await get_ambulance_for_user(db, current_user)
    
    # Get and validate emergency request
    emergency_request = await get_emergency_request(db, location_data.emergency_request_id)
    
    # Verify this ambulance is assigned to this emergency
    if emergency_request.ambulance_service_id != ambulance.id:
        raise HTTPException(
            status_code=403,
            detail="Ambulance ini tidak ditugaskan untuk permintaan darurat ini"
        )
    
    # Verify emergency is in active state
    if emergency_request.status not in {"dispatched", "on_my_way", "on_progress"}:
        raise HTTPException(
            status_code=400,
            detail=f"Tidak dapat mengupdate lokasi untuk emergency dengan status: {emergency_request.status}"
        )
    
    # Validate patient location coordinates are not null
    if emergency_request.location_lat is None or emergency_request.location_lng is None:
        raise HTTPException(
            status_code=400,
            detail="Lokasi pasien tidak valid (koordinat tidak tersedia)"
        )
    
    # Store location update in database
    location_update = AmbulanceLocationUpdate(
        ambulance_service_id=ambulance.id,
        emergency_request_id=emergency_request.id,
        lat=location_data.lat,
        lng=location_data.lng,
        accuracy=location_data.accuracy,
        speed=location_data.speed,
        heading=location_data.heading,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(location_update)
    await db.commit()
    await db.refresh(location_update)
    
    logger.info(
        f"Location update stored for ambulance {ambulance.id} "
        f"on emergency {emergency_request.id}"
    )
    
    # Calculate route and ETA using routing service
    try:
        async with routing_service as rs:
            # Add timeout to prevent hanging on routing service calls
            route_data = await asyncio.wait_for(
                rs.calculate_route(
                    origin_lat=location_data.lat,
                    origin_lng=location_data.lng,
                    dest_lat=emergency_request.location_lat,
                    dest_lng=emergency_request.location_lng
                ),
                timeout=10.0  # 10 second timeout
            )
            
            eta_data = rs.calculate_eta(
                distance_km=route_data["distance_km"],
                current_speed_kmh=location_data.speed
            )
    except asyncio.TimeoutError:
        logger.error("Timeout calculating route")
        raise HTTPException(
            status_code=504,
            detail="Timeout menghitung rute - layanan routing tidak merespons"
        )
    except Exception as e:
        logger.error(f"Error calculating route: {e}")
        raise HTTPException(
            status_code=500,
            detail="Gagal menghitung rute dan ETA"
        )
    
    # Prepare WebSocket broadcast data
    broadcast_data = {
        "ambulance_lat": location_data.lat,
        "ambulance_lng": location_data.lng,
        "accuracy": location_data.accuracy,
        "speed": location_data.speed,
        "heading": location_data.heading,
        "distance_remaining_km": route_data["distance_km"],
        "eta_minutes": eta_data["minutes_remaining"],
        "estimated_arrival": eta_data["estimated_arrival"].isoformat(),
        "route_coordinates": route_data["coordinates"],
        "timestamp": location_update.timestamp.isoformat()
    }
    
    # Broadcast to all WebSocket clients tracking this emergency
    try:
        await tracking_manager.broadcast_location_update(
            emergency_request_id=location_data.emergency_request_id,
            location_data=broadcast_data
        )
        logger.info(
            f"Location update broadcasted for emergency {location_data.emergency_request_id}"
        )
    except Exception as e:
        logger.error(f"Error broadcasting location update: {e}")
        # Don't fail the request if broadcast fails
    
    return LocationUpdateResponse(
        success=True,
        message="Lokasi berhasil diupdate",
        emergency_request_id=location_data.emergency_request_id,
        distance_remaining_km=round(route_data["distance_km"], 2),
        eta_minutes=eta_data["minutes_remaining"],
        timestamp=location_update.timestamp
    )


@router.get("/emergencies/{emergency_request_id}", response_model=TrackingDataResponse)
async def get_tracking_data(
    emergency_request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current tracking data for an emergency request.
    
    Returns:
    - Patient location
    - Current ambulance location (if available)
    - Route information with ETA
    - Emergency status
    
    Args:
        emergency_request_id: Emergency request UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        TrackingDataResponse with complete tracking information
    """
    # Get emergency request
    emergency_request = await get_emergency_request(db, emergency_request_id)
    
    # Verify user has access to this emergency
    # Patient can view their own emergency, ambulance can view assigned emergencies
    if current_user.role == "patient":
        if emergency_request.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Anda tidak memiliki akses ke permintaan darurat ini"
            )
    elif current_user.role == "ambulance":
        # Get ambulance service for current user
        result = await db.execute(
            select(AmbulanceService).where(AmbulanceService.user_id == current_user.id)
        )
        ambulance = result.scalar_one_or_none()
        
        if not ambulance or emergency_request.ambulance_service_id != ambulance.id:
            raise HTTPException(
                status_code=403,
                detail="Anda tidak memiliki akses ke permintaan darurat ini"
            )
    else:
        raise HTTPException(
            status_code=403,
            detail="Akses ditolak"
        )
    
    # Build patient location
    patient_location = PatientLocation(
        lat=emergency_request.location_lat,
        lng=emergency_request.location_lng,
        address=emergency_request.location_address
    )
    
    # Get ambulance info and latest location if assigned
    ambulance_info = None
    route_info = None
    
    if emergency_request.ambulance_service_id:
        # Get ambulance service
        result = await db.execute(
            select(AmbulanceService).where(
                AmbulanceService.id == emergency_request.ambulance_service_id
            )
        )
        ambulance_service = result.scalar_one_or_none()
        
        if ambulance_service:
            # Get latest location update
            result = await db.execute(
                select(AmbulanceLocationUpdate)
                .where(
                    AmbulanceLocationUpdate.emergency_request_id == emergency_request.id,
                    AmbulanceLocationUpdate.ambulance_service_id == ambulance_service.id
                )
                .order_by(AmbulanceLocationUpdate.timestamp.desc())
                .limit(1)
            )
            latest_location = result.scalar_one_or_none()
            
            if latest_location:
                # Validate patient location coordinates before calculating route
                if emergency_request.location_lat is None or emergency_request.location_lng is None:
                    logger.warning(f"Emergency {emergency_request.id} has null location coordinates")
                    # Build ambulance info without route calculation
                    ambulance_info = AmbulanceInfo(
                        id=str(ambulance_service.id),
                        name=ambulance_service.name,
                        phone=ambulance_service.phone,
                        vehicle_type=ambulance_service.vehicle_type,
                        current_lat=latest_location.lat,
                        current_lng=latest_location.lng,
                        speed=latest_location.speed,
                        heading=latest_location.heading,
                        last_update=latest_location.timestamp
                    )
                else:
                    # Build ambulance info with current location
                    ambulance_info = AmbulanceInfo(
                    id=str(ambulance_service.id),
                    name=ambulance_service.name,
                    phone=ambulance_service.phone,
                    vehicle_type=ambulance_service.vehicle_type,
                    current_lat=latest_location.lat,
                    current_lng=latest_location.lng,
                    speed=latest_location.speed,
                    heading=latest_location.heading,
                    last_update=latest_location.timestamp
                    )
                    
                    # Calculate current route and ETA
                    try:
                        async with routing_service as rs:
                            # Add timeout to prevent hanging on routing service calls
                            route_data = await asyncio.wait_for(
                                rs.calculate_route(
                                    origin_lat=latest_location.lat,
                                    origin_lng=latest_location.lng,
                                    dest_lat=emergency_request.location_lat,
                                    dest_lng=emergency_request.location_lng
                                ),
                                timeout=10.0  # 10 second timeout
                            )
                            
                            eta_data = rs.calculate_eta(
                                distance_km=route_data["distance_km"],
                                current_speed_kmh=latest_location.speed
                            )
                            
                            route_info = RouteInfo(
                                distance_km=round(route_data["distance_km"], 2),
                                duration_minutes=round(route_data["duration_minutes"], 1),
                                coordinates=route_data["coordinates"],
                                eta_minutes=eta_data["minutes_remaining"],
                                estimated_arrival=eta_data["estimated_arrival"]
                            )
                    except asyncio.TimeoutError:
                        logger.error("Timeout calculating route for tracking data")
                        # Continue without route info if calculation times out
                    except Exception as e:
                        logger.error(f"Error calculating route for tracking data: {e}")
                        # Continue without route info if calculation fails
            else:
                # No location updates yet, use ambulance base location
                ambulance_info = AmbulanceInfo(
                    id=str(ambulance_service.id),
                    name=ambulance_service.name,
                    phone=ambulance_service.phone,
                    vehicle_type=ambulance_service.vehicle_type,
                    current_lat=ambulance_service.lat,
                    current_lng=ambulance_service.lng,
                    speed=None,
                    heading=None,
                    last_update=emergency_request.created_at
                )
    
    return TrackingDataResponse(
        emergency_request_id=emergency_request_id,
        status=emergency_request.status,
        patient_location=patient_location,
        ambulance=ambulance_info,
        route=route_info,
        last_updated=datetime.now(timezone.utc)
    )
