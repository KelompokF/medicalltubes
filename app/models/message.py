# app/models/message.py

from sqlalchemy import Column, Text, DateTime
from datetime import datetime
import uuid

from app.database import Base
from app.models.user import GUID

class Message(Base):
    __tablename__ = "messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    sender_id = Column(GUID(), nullable=True)
    receiver_id = Column(GUID(), nullable=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)