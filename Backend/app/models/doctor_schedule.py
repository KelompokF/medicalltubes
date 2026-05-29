# app/models/doctor_schedule.py

from sqlalchemy import Column, String, ForeignKey, Enum as SAEnum, DateTime, Boolean
from datetime import datetime
import uuid
import enum

from app.database import Base
from app.models.user import GUID


class DayOfWeek(str, enum.Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    
    doctor_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    day_of_week = Column(SAEnum(DayOfWeek), nullable=False)
    start_time = Column(String, nullable=False)  # e.g., "08:00"
    end_time = Column(String, nullable=False)    # e.g., "12:00"
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
