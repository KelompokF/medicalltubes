from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from app.schemas.prescription import MedicationItem

class DashboardStats(BaseModel):
    totalConsultations: int
    homeVisitBookings: int
    emergencyRequests: int
    activePrescriptions: int

class ActivityItem(BaseModel):
    id: str
    status: str
    description: str
    date: str

class UpcomingAppointment(BaseModel):
    doctor: str
    specialization: str
    date: str
    time: str
    type: str

class HistoryItem(BaseModel):
    id: str
    doctor: str
    specialization: str
    date: str
    time: str
    status: str
    type: str

class PrescriptionDashboardItem(BaseModel):
    id: uuid.UUID
    doctor: str
    date: str
    medications: List[MedicationItem]
    notes: Optional[str] = None

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recentActivities: List[ActivityItem]
    consultationHistory: List[HistoryItem] = []
    bookingHistory: List[HistoryItem] = []
    upcomingAppointment: Optional[UpcomingAppointment] = None
    prescriptions: List[PrescriptionDashboardItem] = []
