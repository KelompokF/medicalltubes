import re
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.models.home_visit import HomeVisitStatus


# Regex pola nomor telepon yang valid (format Indonesia: +62 atau 08xx)
PHONE_REGEX = re.compile(r"^(\+62|62|0)[0-9]{8,13}$")


class HomeVisitRequestCreate(BaseModel):
    """Schema untuk membuat permintaan kunjungan rumah baru."""

    patient_name: str
    doctor_id: Optional[UUID] = None  # ID dokter yang dipilih
    address: str
    phone_number: str
    complaint: str
    preferred_date: datetime
    preferred_time: str  # Jam kunjungan (e.g. "10:00")

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validasi format nomor telepon (format Indonesia atau internasional)."""
        cleaned = v.strip().replace(" ", "").replace("-", "")
        if not PHONE_REGEX.match(cleaned):
            raise ValueError(
                "Nomor telepon tidak valid. Gunakan format: 08xx, +628xx, atau 628xx"
            )
        return cleaned

    @field_validator("preferred_date")
    @classmethod
    def validate_preferred_date(cls, v: datetime) -> datetime:
        """Validasi tanggal kunjungan tidak boleh di masa lalu."""
        # Bandingkan hanya tanggal, abaikan komponen waktu
        if v.date() < datetime.utcnow().date():
            raise ValueError("Tanggal kunjungan tidak boleh di masa lalu")
        return v

    @field_validator("patient_name", "address", "complaint")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        """Validasi field tidak boleh kosong."""
        if not v or not v.strip():
            raise ValueError("Field ini tidak boleh kosong")
        return v.strip()


class HomeVisitRequestResponse(BaseModel):
    """Schema untuk respons data permintaan kunjungan rumah."""

    id: UUID
    user_id: Optional[UUID]
    doctor_id: Optional[UUID]
    doctor_name: Optional[str] = None  # Nama dokter (hasil join)
    patient_name: str
    address: str
    phone_number: str
    complaint: str
    preferred_date: datetime
    preferred_time: Optional[str]
    status: HomeVisitStatus
    created_at: datetime

    # Gunakan from_attributes agar kompatibel dengan SQLAlchemy ORM objects
    model_config = ConfigDict(from_attributes=True)
