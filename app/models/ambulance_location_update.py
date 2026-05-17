from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey

from app.database import Base
from app.models.user import GUID


class AmbulanceLocationUpdate(Base):
    """
    Model for storing ambulance GPS location updates during emergency responses.
    Tracks real-time location history for ambulances en route to emergencies.
    """
    __tablename__ = "ambulance_location_updates"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    ambulance_service_id = Column(
        GUID(),
        ForeignKey("ambulance_services.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    emergency_request_id = Column(
        GUID(),
        ForeignKey("emergency_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
