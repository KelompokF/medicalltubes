from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    place_of_birth = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    blood_type = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
