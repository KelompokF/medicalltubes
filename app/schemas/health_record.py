from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class HealthRecordBase(BaseModel):
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    notes: Optional[str] = None
    date: Optional[datetime] = None  # If not provided, backend uses utcnow

class HealthRecordCreate(HealthRecordBase):
    pass

class HealthRecordResponse(HealthRecordBase):
    id: UUID
    user_id: UUID
    date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
