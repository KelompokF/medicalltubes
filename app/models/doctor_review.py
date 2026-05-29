# app/models/doctor_review.py

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
import uuid

from app.database import Base
from app.models.user import GUID


class DoctorReview(Base):
    """
    Menyimpan rating dan komentar pasien untuk dokter.
    Satu pasien hanya bisa memberi satu review per sesi konsultasi / home visit.
    """
    __tablename__ = "doctor_reviews"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    doctor_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    context_type = Column(String, nullable=False)  # "consultation" or "home_visit"
    context_id = Column(GUID(), nullable=False)  # chat_room.id or home_visit_request.id
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "patient_id", "doctor_id", "context_type", "context_id",
            name="uq_review_per_session"
        ),
    )
