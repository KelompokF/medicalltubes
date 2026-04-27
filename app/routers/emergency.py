"""
Emergency & Ambulance Service Router
-------------------------------------
Queries the ambulance_services table in the database to find
nearby ambulance services based on the user's GPS coordinates.
Uses Haversine formula for distance calculation.
"""

import math
import uuid
from datetime import UTC, datetime
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.ambulance import AmbulanceService
from app.models.emergency_request import EmergencyRequestRecord
from app.models.user import User
from app.schemas.emergency import (
    AmbulanceServiceResponse,
    NearbyAmbulancesResponse,
    EmergencyRequest,
    EmergencyRequestResponse,
)

router = APIRouter(prefix="/emergencies", tags=["Emergency"])

# ─── Constants ────────────────────────────────────────────────────
DEFAULT_RADIUS_KM = 50.0
MAX_RADIUS_KM = 200.0
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_USER_AGENT = "Medicall/1.0"
# Average ambulance speed (km/h) for ETA estimation
AVG_AMBULANCE_SPEED_KMH = 40


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


async def reverse_geocode_address(lat: float, lng: float) -> Optional[str]:
    """Resolve GPS coordinates to a readable address using OpenStreetMap Nominatim."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                NOMINATIM_REVERSE_URL,
                params={
                    "format": "jsonv2",
                    "lat": lat,
                    "lon": lng,
                    "addressdetails": 1,
                    "accept-language": "id",
                },
                headers={"User-Agent": NOMINATIM_USER_AGENT},
            )
        response.raise_for_status()
        data = response.json()
    except Exception:
        return None

    display_name = data.get("display_name") if isinstance(data, dict) else None
    if isinstance(display_name, str) and display_name.strip():
        return display_name
    return None


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

    user_address = await reverse_geocode_address(lat, lng)

    return NearbyAmbulancesResponse(
        user_lat=lat,
        user_lng=lng,
        address=user_address,
        ambulances=responses,
        total=len(responses),
        search_radius_km=radius_km,
    )


@router.post("/", response_model=EmergencyRequestResponse)
async def request_emergency(
    data: EmergencyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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
    if nearest:
        nearest_response = ambulance_to_response(nearest, data.location.lat, data.location.lng)

    status = "on_progress"
    message = (
        f"Ambulans terdekat ditemukan: {nearest_response.name} ({nearest_response.distance_text}). ETA: {nearest_response.eta_text}."
        if nearest_response
        else "Sedang mencari ambulans terdekat di area Anda..."
    )
    request_record = EmergencyRequestRecord(
        id=uuid.uuid4(),
        patient_id=current_user.id,
        lat=data.location.lat,
        lng=data.location.lng,
        request_type=data.type or "general",
        notes=data.notes,
        status=status,
        message=message,
        ambulance_service_id=nearest.id if nearest else None,
        ambulance_name=nearest.name if nearest else None,
    )
    db.add(request_record)
    await db.commit()

    return EmergencyRequestResponse(
        id=str(request_record.id),
        status=status,
        message=message,
        created_at=request_record.created_at or datetime.now(UTC),
        ambulance_assigned=nearest_response,
    )


@router.post("/{emergency_id}/complete", response_model=EmergencyRequestResponse)
async def complete_emergency_request(
    emergency_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark the current patient's emergency request as completed."""
    try:
        request_uuid = uuid.UUID(emergency_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid emergency request ID format")

    result = await db.execute(
        select(EmergencyRequestRecord).where(
            EmergencyRequestRecord.id == request_uuid,
            EmergencyRequestRecord.patient_id == current_user.id,
        )
    )
    request_record = result.scalar_one_or_none()

    if not request_record:
        raise HTTPException(status_code=404, detail="Permintaan darurat tidak ditemukan")

    request_record.status = "completed"
    request_record.message = "Permintaan darurat telah selesai."
    await db.commit()

    return EmergencyRequestResponse(
        id=str(request_record.id),
        status=request_record.status,
        message=request_record.message,
        created_at=request_record.created_at or datetime.now(UTC),
        ambulance_assigned=None,
    )


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
