# app/models/chat_room.py

from sqlalchemy import Column, Text, DateTime, String, Enum as SAEnum
from datetime import datetime
import uuid
import enum

from app.database import Base
from app.models.user import GUID


class RoomStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"


class ChatRoom(Base):
    """
    Chat Room menyimpan seluruh percakapan antara pasien dan dokter.
    
    - Satu baris per pasangan pasien-dokter (bukan satu baris per pesan).
    - Kolom `encrypted_messages` menyimpan seluruh riwayat chat dalam bentuk
      JSON yang dienkripsi menggunakan Fernet (AES-128-CBC).
    - Status room bisa active / ended.
    """
    __tablename__ = "chat_rooms"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(GUID(), nullable=False, index=True)
    doctor_id = Column(GUID(), nullable=False, index=True)
    status = Column(String, default=RoomStatus.ACTIVE)
    encrypted_messages = Column(Text, default="")  # Fernet-encrypted JSON blob
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
