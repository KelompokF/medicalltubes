from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ambulance_id = Column(UUID(as_uuid=True), ForeignKey("ambulance_services.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="pending")  # pending, dispatched, on_route, arrived, completed, cancelled
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    emergency_type = Column(String, default="general")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
