# app/models/doctor_profile.py

from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from datetime import datetime
import uuid

from app.database import Base
from app.models.user import GUID


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    # Professional info
    specialization = Column(String, nullable=False)
    hospital_name = Column(String, nullable=False)
    hospital_address = Column(String, nullable=True)
    about = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0)
    fee = Column(Integer, default=100000)  # consultation fee in IDR
    phone = Column(String, nullable=True)
    # GPS coordinates of the hospital/clinic
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    # Status
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=4.5)
    total_reviews = Column(Integer, default=0)
    total_patients = Column(Integer, default=0)
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
