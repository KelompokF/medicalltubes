from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from datetime import date, datetime


class PatientProfileCreateUpdate(BaseModel):
    full_name: str
    email: EmailStr
    place_of_birth: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None


class PatientProfileResponse(PatientProfileCreateUpdate):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
