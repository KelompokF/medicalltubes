from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
import uuid
from app.database import Base
from app.models.user import GUID

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    status = Column(String, default="active")  # active, completed, cancelled
    scheduled_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
