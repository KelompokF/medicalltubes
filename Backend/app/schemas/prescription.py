from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class MedicationItem(BaseModel):
    name: str
    dosage: str
    duration: str
    instructions: str

class PrescriptionCreate(BaseModel):
    room_id: Optional[UUID] = None
    patient_id: UUID
    medications: List[MedicationItem]
    notes: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: UUID
    room_id: Optional[UUID]
    doctor_id: UUID
    patient_id: UUID
    medications: List[MedicationItem]
    notes: Optional[str]
    status: Optional[str] = "waiting_confirmation"
    created_at: datetime

    class Config:
        from_attributes = True
