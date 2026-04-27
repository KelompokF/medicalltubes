from sqlalchemy import Column, String, Text, DateTime, Date, ForeignKey, Enum as SAEnum
from datetime import datetime
import uuid
import enum

from app.database import Base
from app.models.user import GUID


# ========================
# STATUS (GABUNGAN FINAL)
# ========================
class HomeVisitStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    on_the_way = "on_the_way"
    arrived = "arrived"
    completed = "completed"
    cancelled = "cancelled"


# ========================
# MODEL BOOKING (UNTUK TRACKING & HISTORY)
# ========================
class HomeVisit(Base):
    __tablename__ = "home_visits"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)

    patient_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    doctor_id = Column(GUID(), nullable=True, index=True)
    doctor_name = Column(String, nullable=True)
    specialization = Column(String, nullable=True)

    date = Column(Date, nullable=False)
    time = Column(String, nullable=False)

    address = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)

    status = Column(
        SAEnum(HomeVisitStatus),
        default=HomeVisitStatus.pending,
        nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ========================
# MODEL REQUEST (PUNYA LAURA - TETAP DIPERTAHANKAN)
# ========================
class HomeVisitRequest(Base):
    __tablename__ = "home_visit_requests_v3"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    doctor_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    patient_name = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    phone_number = Column(String, nullable=False)

    complaint = Column(Text, nullable=False)
    preferred_date = Column(DateTime, nullable=False)
    preferred_time = Column(String, nullable=True)

    status = Column(
        SAEnum(HomeVisitStatus),
        default=HomeVisitStatus.pending,
        nullable=False,
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)