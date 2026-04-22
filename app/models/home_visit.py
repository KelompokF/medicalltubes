from sqlalchemy import Column, String, Text, DateTime, Enum as SAEnum, ForeignKey
from datetime import datetime
import uuid
import enum

from app.database import Base
from app.models.user import GUID


class HomeVisitStatus(str, enum.Enum):
    """Enum untuk status permintaan kunjungan rumah."""
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"


class HomeVisitRequest(Base):
    """Model untuk menyimpan permintaan kunjungan rumah (home visit)."""

    __tablename__ = "home_visit_requests_v3"

    # Primary key menggunakan GUID (kompatibel dengan PostgreSQL dan SQLite)
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)

    # Foreign key ke tabel users (opsional untuk keperluan preview/tanpa login)
    user_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Foreign key ke tabel users (untuk dokter yang dipilih)
    doctor_id = Column(
        GUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Informasi pasien
    patient_name = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    phone_number = Column(String, nullable=False)

    # Detail keluhan dan jadwal kunjungan
    complaint = Column(Text, nullable=False)
    preferred_date = Column(DateTime, nullable=False)
    preferred_time = Column(String, nullable=True)  # Jam kunjungan (e.g. "10:00")

    # Status permintaan (default: pending)
    status = Column(
        SAEnum(HomeVisitStatus),
        default=HomeVisitStatus.pending,
        nullable=False,
    )

    # Waktu pembuatan permintaan
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
