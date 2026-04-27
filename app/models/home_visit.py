# app/models/home_visit.py

from sqlalchemy import Column, String, Text, DateTime, Date, Enum as SAEnum
from datetime import datetime
import uuid
import enum

from app.database import Base
from app.models.user import GUID


class HomeVisitStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    on_the_way = "on_the_way"
    arrived = "arrived"
    completed = "completed"
    cancelled = "cancelled"


class HomeVisit(Base):
    __tablename__ = "home_visits"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(GUID(), nullable=False, index=True)
    doctor_id = Column(GUID(), nullable=True, index=True)
    doctor_name = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, default=HomeVisitStatus.pending.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
