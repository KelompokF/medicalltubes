from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String

from app.database import Base
from app.models.user import GUID


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    ambulance_service_id = Column(GUID(), ForeignKey("ambulance_services.id"), nullable=True, index=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    location_address = Column(String, nullable=True)
    type = Column(String, nullable=False, default="general")
    notes = Column(String, nullable=True)
    status = Column(String, nullable=False, default="dispatched")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
