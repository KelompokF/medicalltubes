"""
Emergency & Ambulance Service Router
-------------------------------------
Queries the ambulance_services table in the database to find
nearby ambulance services based on the user's GPS coordinates.
Uses Haversine formula for distance calculation.
"""

import math
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.dependencies import get_current_user
from app.database import get_db
from app.models.ambulance import AmbulanceService
from app.models.emergency_request import EmergencyRequest as EmergencyRequestRecord
from app.models.user import User
from app.schemas.emergency_history import (
    EmergencyHistoryItem,
    EmergencyHistoryPagination,
    EmergencyHistoryResponse,
)
from app.schemas.emergency import (
    ActiveEmergenciesResponse,
    ActiveEmergencyItem,
    AmbulanceServiceResponse,
    EmergencyRequest,
    EmergencyRequestResponse,
    EmergencyStatusUpdate,
    NearbyAmbulancesResponse,
)

router = APIRouter(prefix="/emergencies", tags=["Emergency"])

# ─── Constants ────────────────────────────────────────────────────
DEFAULT_RADIUS_KM = 50.0
MAX_RADIUS_KM = 200.0
# Average ambulance speed (km/h) for ETA estimation
AVG_AMBULANCE_SPEED_KMH = 40
HISTORY_FILTERS = {"all", "today", "yesterday", "last_7_days", "this_month"}
ACTIVE_REQUEST_STATUSES = {"searching", "dispatched", "on_my_way", "on_progress"}


def get_history_start_date(filter_type: str) -> Optional[datetime]:
    now = datetime.utcnow()
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if filter_type == "today":
        return start_today
    if filter_type == "yesterday":
        return start_today - timedelta(days=1)
    if filter_type == "last_7_days":
        return now - timedelta(days=7)
    if filter_type == "this_month":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return None


# ─── Helpers ──────────────────────────────────────────────────────
def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two points using the Haversine formula."""
    R = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def format_distance(km: float) -> str:
    """Return human-readable distance string."""
    if km < 1:
        return f"{int(km * 1000)} m"
    return f"{km:.1f} km"


def estimate_eta_minutes(distance_km: float) -> int:
    """Estimate ETA in minutes based on distance."""
    minutes = (distance_km / AVG_AMBULANCE_SPEED_KMH) * 60
    return max(1, round(minutes))


def format_eta(minutes: int) -> str:
    """Return human-readable ETA."""
    if minutes < 60:
        return f"{minutes} menit"
    hours = minutes // 60
    remaining = minutes % 60
    if remaining == 0:
        return f"{hours} jam"
    return f"{hours} jam {remaining} menit"


def ambulance_to_response(amb: AmbulanceService, user_lat: float, user_lng: float) -> AmbulanceServiceResponse:
    """Convert a database AmbulanceService model to an API response."""
    dist_km = haversine(user_lat, user_lng, amb.lat, amb.lng)
    eta_min = estimate_eta_minutes(dist_km)

    return AmbulanceServiceResponse(
        id=str(amb.id),
        name=amb.name,
        address=amb.address or "Alamat tidak tersedia",
        lat=amb.lat,
        lng=amb.lng,
        distance_km=round(dist_km, 2),
        distance_text=format_distance(dist_km),
        eta_minutes=eta_min,
        eta_text=format_eta(eta_min),
        phone=amb.phone,
        status=amb.status or "available",
        source=f"database:{amb.vehicle_type or 'standard'}",
    )


# ─── Endpoints ────────────────────────────────────────────────────

@router.get("/ambulances", response_model=NearbyAmbulancesResponse)
async def get_nearby_ambulances(
    lat: float = Query(..., ge=-90, le=90, description="User latitude"),
    lng: float = Query(..., ge=-180, le=180, description="User longitude"),
    radius_km: float = Query(DEFAULT_RADIUS_KM, ge=1, le=MAX_RADIUS_KM, description="Search radius in km"),
    db: AsyncSession = Depends(get_db),
):
    """
    Find nearby ambulance services based on the user's GPS coordinates.
    Queries the database and filters by distance using Haversine formula.
    """
    # Get all active ambulances from DB
    result = await db.execute(
        select(AmbulanceService).where(
            AmbulanceService.is_active == True
        )
    )
    all_ambulances = result.scalars().all()

    # Calculate distance for each and filter by radius
    responses = []
    for amb in all_ambulances:
        dist_km = haversine(lat, lng, amb.lat, amb.lng)
        if dist_km <= radius_km:
            responses.append(ambulance_to_response(amb, lat, lng))

    # Sort by distance
    responses.sort(key=lambda x: x.distance_km)

    return NearbyAmbulancesResponse(
        user_lat=lat,
        user_lng=lng,
        address=None,
        ambulances=responses,
        total=len(responses),
        search_radius_km=radius_km,
    )


@router.get("/history", response_model=EmergencyHistoryResponse)
async def get_emergency_history(
    filter: str = Query("all", description="all | today | yesterday | last_7_days | this_month"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "ambulance":
        raise HTTPException(status_code=403, detail="Hanya akun ambulance yang dapat mengakses riwayat emergency")

    if filter not in HISTORY_FILTERS:
        raise HTTPException(status_code=400, detail="Filter tidak valid")

    ambulance_result = await db.execute(
        select(AmbulanceService).where(AmbulanceService.user_id == current_user.id)
    )
    ambulance_services = ambulance_result.scalars().all()

    if not ambulance_services:
        return EmergencyHistoryResponse(
            data=[],
            pagination=EmergencyHistoryPagination(page=page, limit=limit, total_items=0, total_pages=0),
        )

    ambulance_by_id = {service.id: service for service in ambulance_services}
    filters = [EmergencyRequestRecord.ambulance_service_id.in_(list(ambulance_by_id.keys()))]
    start_date = get_history_start_date(filter)
    if start_date is not None:
        if filter == "yesterday":
            end_date = start_date + timedelta(days=1)
            filters.append(EmergencyRequestRecord.created_at >= start_date)
            filters.append(EmergencyRequestRecord.created_at < end_date)
        else:
            filters.append(EmergencyRequestRecord.created_at >= start_date)

    total_result = await db.execute(
        select(func.count(EmergencyRequestRecord.id)).where(*filters)
    )
    total_items = total_result.scalar_one() or 0
    total_pages = (total_items + limit - 1) // limit if total_items else 0

    records_result = await db.execute(
        select(EmergencyRequestRecord, User)
        .outerjoin(User, EmergencyRequestRecord.user_id == User.id)
        .where(*filters)
        .order_by(EmergencyRequestRecord.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    records = records_result.all()

    items = []
    for record, requester in records:
        ambulance_service = ambulance_by_id.get(record.ambulance_service_id)
        distance_km = 0
        if ambulance_service is not None:
            distance_km = haversine(
                ambulance_service.lat,
                ambulance_service.lng,
                record.location_lat,
                record.location_lng,
            )
        items.append(
            EmergencyHistoryItem(
                id=str(record.id),
                user_id=str(record.user_id) if record.user_id else None,
                user_name=requester.full_name if requester else None,
                created_at=record.created_at,
                location_address=record.location_address,
                location_lat=record.location_lat,
                location_lng=record.location_lng,
                distance_km=round(distance_km, 2),
                status=record.status,
                type=record.type,
                notes=record.notes,
            )
        )

    return EmergencyHistoryResponse(
        data=items,
        pagination=EmergencyHistoryPagination(
            page=page,
            limit=limit,
            total_items=total_items,
            total_pages=total_pages,
        ),
    )


@router.get("/active", response_model=ActiveEmergenciesResponse)
async def get_active_emergencies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "ambulance":
        raise HTTPException(
            status_code=403,
            detail="Hanya akun ambulance yang dapat mengakses emergency aktif",
        )

    ambulance_result = await db.execute(
        select(AmbulanceService).where(AmbulanceService.user_id == current_user.id)
    )
    ambulance_services = ambulance_result.scalars().all()

    if not ambulance_services:
        return ActiveEmergenciesResponse(data=[], total=0)

    ambulance_by_id = {service.id: service for service in ambulance_services}
    records_result = await db.execute(
        select(EmergencyRequestRecord, User)
        .outerjoin(User, EmergencyRequestRecord.user_id == User.id)
        .where(
            EmergencyRequestRecord.ambulance_service_id.in_(
                list(ambulance_by_id.keys())
            ),
            EmergencyRequestRecord.status.in_(ACTIVE_REQUEST_STATUSES),
        )
        .order_by(EmergencyRequestRecord.created_at.desc())
    )
    records = records_result.all()

    items = []
    for record, requester in records:
        ambulance_service = ambulance_by_id.get(record.ambulance_service_id)
        distance_km = 0
        if ambulance_service is not None:
            distance_km = haversine(
                ambulance_service.lat,
                ambulance_service.lng,
                record.location_lat,
                record.location_lng,
            )

        items.append(
            ActiveEmergencyItem(
                id=str(record.id),
                user_id=str(record.user_id) if record.user_id else None,
                user_name=requester.full_name if requester else None,
                created_at=record.created_at,
                location_address=record.location_address,
                location_lat=record.location_lat,
                location_lng=record.location_lng,
                distance_km=round(distance_km, 2),
                status=record.status,
                type=record.type,
                notes=record.notes,
            )
        )

    return ActiveEmergenciesResponse(data=items, total=len(items))


@router.post("/", response_model=EmergencyRequestResponse)
async def request_emergency(
    data: EmergencyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create an emergency request. Finds the nearest available ambulance
    and assigns it to the request.
    """
    # Get all active & available ambulances
    result = await db.execute(
        select(AmbulanceService).where(
            AmbulanceService.is_active == True,
            AmbulanceService.status == "available",
        )
    )
    all_ambulances = result.scalars().all()

    # Find nearest
    nearest = None
    nearest_dist = float("inf")
    for amb in all_ambulances:
        dist = haversine(data.location.lat, data.location.lng, amb.lat, amb.lng)
        if dist < nearest_dist:
            nearest_dist = dist
            nearest = amb

    nearest_response = None
    request_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    status = "searching"

    if nearest:
        nearest_response = ambulance_to_response(nearest, data.location.lat, data.location.lng)
        status = "dispatched"

    emergency_record = EmergencyRequestRecord(
        user_id=current_user.id,
        ambulance_service_id=nearest.id if nearest else None,
        location_lat=data.location.lat,
        location_lng=data.location.lng,
        location_address=None,
        type=data.type or "general",
        notes=data.notes,
        status=status,
    )
    db.add(emergency_record)
    await db.commit()
    await db.refresh(emergency_record)
    request_id = str(emergency_record.id)
    created_at = emergency_record.created_at

    return EmergencyRequestResponse(
        id=request_id,
        status=status,
        message=(
            f"Ambulans terdekat ditemukan: {nearest_response.name} ({nearest_response.distance_text}). ETA: {nearest_response.eta_text}."
            if nearest_response
            else "Sedang mencari ambulans terdekat di area Anda..."
        ),
        created_at=created_at,
        ambulance_assigned=nearest_response,
    )

@router.get("/{request_id}/status")
async def get_emergency_status(request_id: str):
    """Return the current emergency status shape used by the frontend."""
    try:
        uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid emergency request ID format")

    return {
        "id": request_id,
        "status": "dispatched",
        "message": "Permintaan darurat sedang aktif.",
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.patch("/{request_id}/status")
async def update_emergency_status(
    request_id: str,
    data: EmergencyStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Persist emergency request status updates for patient and ambulance flows."""
    try:
        request_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid emergency request ID format")

    result = await db.execute(
        select(EmergencyRequestRecord).where(EmergencyRequestRecord.id == request_uuid)
    )
    emergency_record = result.scalar_one_or_none()

    if emergency_record is None:
        raise HTTPException(status_code=404, detail="Permintaan emergency tidak ditemukan")

    emergency_record.status = data.status
    if data.status == "completed":
        emergency_record.completed_at = datetime.utcnow()
    elif data.status in {"cancelled", "on_my_way", "on_progress"}:
        emergency_record.completed_at = None

    await db.commit()
    await db.refresh(emergency_record)

    messages = {
        "cancelled": "Permintaan darurat dibatalkan.",
        "on_my_way": "Ambulans sedang menuju lokasi pasien.",
        "on_progress": "Penanganan pasien sedang berlangsung.",
        "completed": "Permintaan darurat diselesaikan.",
    }

    return {
        "success": True,
        "id": str(emergency_record.id),
        "status": emergency_record.status,
        "message": messages[data.status],
        "updated_at": datetime.utcnow().isoformat(),
    }

@router.post("/ambulances/{ambulance_id}/call")
async def call_ambulance(ambulance_id: str, db: AsyncSession = Depends(get_db)):
    """
    Simulate calling a specific ambulance service.
    Returns the ambulance's phone number if available.
    """
    try:
        amb_uuid = uuid.UUID(ambulance_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ambulance ID format")

    result = await db.execute(
        select(AmbulanceService).where(AmbulanceService.id == amb_uuid)
    )
    ambulance = result.scalar_one_or_none()

    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulans tidak ditemukan")

    return {
        "success": True,
        "ambulance_id": str(ambulance.id),
        "ambulance_name": ambulance.name,
        "phone": ambulance.phone,
        "message": f"Panggilan darurat telah dikirim ke {ambulance.name}. Mereka akan segera menghubungi Anda.",
        "timestamp": datetime.utcnow().isoformat(),
    }
