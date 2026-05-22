from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class AmbulanceService(Base):
    __tablename__ = "ambulance_services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Link to the user account (role='ambulance')
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    # GPS coordinates
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    area = Column(String, nullable=True)  # e.g. "Jakarta Selatan"
    # Status: available, busy, offline
    status = Column(String, default="available")
    is_active = Column(Boolean, default=True)
    # Vehicle info
    vehicle_plate = Column(String, nullable=True)
    vehicle_type = Column(String, default="standard")  # standard, icu, neonatal
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
