# app/schemas/doctor_schedule.py

from pydantic import BaseModel
from typing import List


# ─── Response schemas ────────────────────────────────────────────────────────

class DaySchedule(BaseModel):
    """One day's available slots, e.g. { hari: 'Senin', slots: ['08:00', '09:00'] }"""
    hari: str
    slots: List[str]  # "HH:MM" strings (seconds stripped for frontend)


class DoctorScheduleResponse(BaseModel):
    doctor_id: str
    schedule: List[DaySchedule]


# ─── Request schemas (doctor updates own schedule) ───────────────────────────

class DayScheduleInput(BaseModel):
    """One day + list of desired time slots the doctor wants to be available."""
    hari: str
    slots: List[str]  # "HH:MM" strings


class DoctorScheduleUpdate(BaseModel):
    """Full replacement: send all 7 days (or however many). Missing days = deleted."""
    schedule: List[DayScheduleInput]
