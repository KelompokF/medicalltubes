from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LocationInput(BaseModel):
    lat: float = Field(..., description="Latitude", ge=-90, le=90)
    lng: float = Field(..., description="Longitude", ge=-180, le=180)


class AmbulanceServiceResponse(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float
    distance_km: float = Field(..., description="Distance in kilometers")
    distance_text: str = Field(..., description="Human-readable distance")
    eta_minutes: int = Field(..., description="Estimated time of arrival in minutes")
    eta_text: str = Field(..., description="Human-readable ETA")
    phone: Optional[str] = None
    status: str = "available"
    source: str = "openstreetmap"


class NearbyAmbulancesResponse(BaseModel):
    user_lat: float
    user_lng: float
    address: Optional[str] = None
    ambulances: List[AmbulanceServiceResponse]
    total: int
    search_radius_km: float


class EmergencyRequestSchema(BaseModel):
    patient_id: Optional[str] = None
    location: LocationInput
    type: Optional[str] = "general"
    notes: Optional[str] = None


class EmergencyRequestResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: datetime
    ambulance_assigned: Optional[AmbulanceServiceResponse] = None
