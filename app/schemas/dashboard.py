from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

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

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recentActivities: List[ActivityItem]
    upcomingAppointment: Optional[UpcomingAppointment] = None
