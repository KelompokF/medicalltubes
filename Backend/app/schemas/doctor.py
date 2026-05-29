from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DoctorListItem(BaseModel):
    id: str
    user_id: str
    name: str
    specialization: str
    hospital_name: str
    hospital_address: Optional[str] = None
    experience_years: int = 0
    fee: int = 100000
    rating: float = 4.5
    total_reviews: int = 0
    is_available: bool = True
    lat: Optional[float] = None
    lng: Optional[float] = None
    distance_km: Optional[float] = None
    distance_text: Optional[str] = None


class DoctorDetailResponse(BaseModel):
    id: str
    user_id: str
    name: str
    specialization: str
    hospital_name: str
    hospital_address: Optional[str] = None
    about: Optional[str] = None
    experience_years: int = 0
    fee: int = 100000
    phone: Optional[str] = None
    rating: float = 4.5
    total_reviews: int = 0
    total_patients: int = 0
    is_available: bool = True
    lat: Optional[float] = None
    lng: Optional[float] = None


class DoctorSearchResponse(BaseModel):
    doctors: List[DoctorListItem]
    total: int
    specializations: List[str]


class StartConsultationRequest(BaseModel):
    doctor_id: str = Field(..., description="The doctor's user_id to start chat with")


class StartConsultationResponse(BaseModel):
    success: bool
    doctor_id: str
    doctor_name: str
    message: str
