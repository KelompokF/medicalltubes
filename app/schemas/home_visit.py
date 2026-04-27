# app/schemas/home_visit.py

from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
import uuid


class HomeVisitCreate(BaseModel):
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    specialization: Optional[str] = None
    date: date
    time: str
    address: str
    notes: Optional[str] = None


class HomeVisitResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    doctor_name: Optional[str] = None
    specialization: Optional[str] = None
    date: date
    time: str
    address: str
    notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HomeVisitTrackingResponse(BaseModel):
    id: uuid.UUID
    doctor_name: Optional[str] = None
    specialization: Optional[str] = None
    date: date
    time: str
    address: str
    notes: Optional[str] = None
    status: str
    # Steps for timeline
    steps: list

    class Config:
        from_attributes = True
