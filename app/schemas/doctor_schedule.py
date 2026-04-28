# app/schemas/doctor_schedule.py

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class DoctorScheduleItem(BaseModel):
    id: UUID
    day_of_week: str
    start_time: str
    end_time: str
    is_active: bool
    
    class Config:
        from_attributes = True


class DoctorWithSchedules(BaseModel):
    id: UUID
    doctor_id: UUID
    name: str
    specialization: Optional[str]
    hospital_name: Optional[str]
    experience_years: int
    fee: int
    rating: float
    is_available: bool
    schedules: List[DoctorScheduleItem]
    
    class Config:
        from_attributes = True
