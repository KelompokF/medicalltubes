from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from datetime import datetime
import uuid

from app.database import Base
from app.models.user import GUID


class Report(Base):
    """
    Tabel reports untuk menyimpan laporan kegiatan menyimpang antar pengguna.

    Mendukung konteks:
    - consultation: laporan antara pasien <-> dokter saat konsultasi chat
    - emergency: laporan antara pasien <-> ambulance saat emergency request
    """
    __tablename__ = "reports"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_role = Column(String, nullable=False)  # patient, doctor, ambulance
    reported_role = Column(String, nullable=False)  # patient, doctor, ambulance
    reason = Column(String, nullable=False)  # inappropriate_behavior, unprofessional, harassment, fraud, other
    description = Column(Text, nullable=False)
    context_type = Column(String, nullable=False)  # consultation, emergency
    context_id = Column(GUID(), nullable=True)  # room_id or emergency_request_id
    status = Column(String, nullable=False, default="pending")  # pending, reviewed, resolved, dismissed
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
