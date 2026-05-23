from sqlalchemy import Column, Text, DateTime, ForeignKey
from datetime import datetime
import uuid

from app.database import Base
from app.models.user import GUID


class ReportMessage(Base):
    """
    Pesan chat antara pasien (reporter) dan admin terkait sebuah report.
    """
    __tablename__ = "report_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    report_id = Column(GUID(), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
