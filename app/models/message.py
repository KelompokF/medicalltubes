# app/models/message.py

from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
import uuid

from app.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String)
    receiver_id = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)