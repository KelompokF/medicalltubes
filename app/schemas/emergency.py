from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

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

class EmergencyRequest(BaseModel):
    location: Location
    type: Optional[str] = "general"

class EmergencyRequestResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: datetime
    ambulance_assigned: Optional[AmbulanceServiceResponse] = None

class EmergencyStatusUpdate(BaseModel):
    status: Literal["cancelled", "completed"]
