from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text

from app.database import Base
from app.models.user import GUID


class EmergencyRequestRecord(Base):
    __tablename__ = "emergency_requests"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    request_type = Column(String, default="general", nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    ambulance_service_id = Column(GUID(), ForeignKey("ambulance_services.id"), nullable=True, index=True)
    ambulance_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
