from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum


class ReportReason(str, Enum):
    INAPPROPRIATE_BEHAVIOR = "inappropriate_behavior"
    UNPROFESSIONAL = "unprofessional"
    HARASSMENT = "harassment"
    FRAUD = "fraud"
    OTHER = "other"


class ReportContextType(str, Enum):
    CONSULTATION = "consultation"
    EMERGENCY = "emergency"


class ReportStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ReportCreate(BaseModel):
    reported_id: UUID
    reason: ReportReason
    description: str = Field(..., min_length=10, max_length=1000)
    context_type: ReportContextType
    context_id: Optional[UUID] = None


class ReportResponse(BaseModel):
    id: UUID
    reporter_id: UUID
    reported_id: UUID
    reporter_role: str
    reported_role: str
    reporter_name: Optional[str] = None
    reported_name: Optional[str] = None
    reason: str
    description: str
    context_type: str
    context_id: Optional[UUID] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int


class ReportUpdateStatus(BaseModel):
    status: ReportStatus
    admin_notes: Optional[str] = None


class ReportMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class ReportMessageResponse(BaseModel):
    id: UUID
    report_id: UUID
    sender_id: UUID
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
