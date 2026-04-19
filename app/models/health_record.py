from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Optional vital signs and metrics
    blood_pressure = Column(String, nullable=True)  # e.g., "120/80"
    heart_rate = Column(Integer, nullable=True)     # bpm
    weight = Column(Float, nullable=True)           # kg
    height = Column(Float, nullable=True)           # cm
    notes = Column(String, nullable=True)           # Any additional context or symptoms
    
    created_at = Column(DateTime, default=datetime.utcnow)
