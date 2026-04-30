from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
import uuid
from app.database import Base
from app.models.user import GUID

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Vital signs dan metrik kesehatan (semua opsional)
    blood_pressure = Column(String, nullable=True)   # contoh: "120/80"
    heart_rate = Column(Integer, nullable=True)       # bpm
    weight = Column(Float, nullable=True)             # kg
    height = Column(Float, nullable=True)             # cm
    
    # Riwayat Penyakit (Baru)
    diagnosed_conditions = Column(String, nullable=True) # Daftar penyakit yang diderita
    allergies = Column(String, nullable=True)            # Riwayat alergi
    current_medications = Column(String, nullable=True)  # Obat yang sedang dikonsumsi
    
    notes = Column(String, nullable=True)             # Catatan tambahan atau gejala

    created_at = Column(DateTime, default=datetime.utcnow)
