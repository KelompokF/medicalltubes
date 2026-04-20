from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default='patient')
    location_sharing_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Profile fields
    place_of_birth = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    blood_type = Column(String, nullable=True)
    allergies = Column(String, nullable=True)