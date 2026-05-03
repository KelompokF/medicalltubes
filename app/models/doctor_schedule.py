# app/models/doctor_schedule.py

from sqlalchemy import Column, String, Time, ForeignKey
import uuid

from app.database import Base
from app.models.user import GUID


class DoctorSchedule(Base):
    """
    One row = one available time slot for a doctor on a given day.
    hari        : day name in Indonesian (Senin, Selasa, ..., Minggu)
    jam_tersedia: PostgreSQL TIME column (HH:MM:SS)
    """
    __tablename__ = "doctor_schedules"

    id           = Column(GUID(), primary_key=True, default=uuid.uuid4)
    doctor_id    = Column(GUID(), nullable=False, index=True)
    hari         = Column(String, nullable=False)
    jam_tersedia = Column(Time, nullable=False)
    day_of_week  = Column(String, nullable=True)  # existing column, kept for compat
