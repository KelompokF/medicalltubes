from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import TypeDecorator, String as SAString

from datetime import datetime
import uuid
from app.database import Base


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Menggunakan PostgreSQL UUID jika tersedia, fallback ke String(36) untuk SQLite.
    """
    impl = SAString(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(SAString(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    account_status = Column(String, default='active')
    role = Column(String, default='patient')
    location_sharing_enabled = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    reset_otp = Column(String, nullable=True)
    reset_otp_expire = Column(DateTime, nullable=True)
