from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class EmergencyBase(BaseModel):
    latitude: float
    longitude: float
    type: Optional[str] = None

class EmergencyCreate(EmergencyBase):
    pass

class EmergencyResponse(EmergencyBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EmergencyStatusUpdate(BaseModel):
    status: str  # pending, on_route, arrived, completed
