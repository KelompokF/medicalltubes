import re
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime, date
from uuid import UUID

from app.models.home_visit import HomeVisitStatus


# ========================
# REQUEST (PUNYA KAMU)
# ========================
class HomeVisitRequestCreate(BaseModel):
    patient_name: str
    doctor_id: Optional[UUID] = None
    address: str
    phone_number: str
    complaint: str
    preferred_date: str  # accept date string "YYYY-MM-DD" or ISO datetime
    preferred_time: str


class HomeVisitRequestResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    doctor_id: Optional[UUID]
    doctor_name: Optional[str]
    patient_name: str
    address: str
    phone_number: str
    complaint: str
    preferred_date: datetime
    preferred_time: Optional[str]
    status: HomeVisitStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ========================
# BOOKING (FITUR BARU)
# ========================
class HomeVisitCreate(BaseModel):
    doctor_id: Optional[UUID] = None
    doctor_name: Optional[str] = None
    specialization: Optional[str] = None
    date: date
    time: str
    address: str
    notes: Optional[str] = None


class HomeVisitResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: Optional[UUID]
    doctor_name: Optional[str]
    specialization: Optional[str]
    date: date
    time: str
    address: str
    notes: Optional[str]
    status: HomeVisitStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HomeVisitTrackingResponse(BaseModel):
    id: UUID
    doctor_name: Optional[str]
    specialization: Optional[str]
    date: date
    time: str
    address: str
    notes: Optional[str]
    status: str
    steps: list

    model_config = ConfigDict(from_attributes=True)