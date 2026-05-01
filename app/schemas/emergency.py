from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

class AmbulanceServiceResponse(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float
    distance_km: float
    distance_text: str
    eta_minutes: int
    eta_text: str
    phone: Optional[str] = None
    status: str
    source: str

class NearbyAmbulancesResponse(BaseModel):
    user_lat: float
    user_lng: float
    address: Optional[str] = None
    ambulances: List[AmbulanceServiceResponse]
    total: int
    search_radius_km: float

class Location(BaseModel):
    lat: float
    lng: float


LocationInput = Location


class EmergencyRequest(BaseModel):
    location: Location
    type: Optional[str] = "general"
    notes: Optional[str] = None

class EmergencyRequestResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: datetime
    ambulance_assigned: Optional[AmbulanceServiceResponse] = None

class EmergencyStatusUpdate(BaseModel):
    status: Literal["cancelled", "on_my_way", "on_progress", "completed"]


class ActiveEmergencyItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime
    location_address: Optional[str] = None
    location_lat: float
    location_lng: float
    distance_km: float
    status: str
    type: str
    notes: Optional[str] = None


class ActiveEmergenciesResponse(BaseModel):
    data: List[ActiveEmergencyItem]
    total: int
