from logging.config import fileConfig
from sqlalchemy import create_engine
from sqlalchemy import pool
from alembic import context
from app.core.config import normalize_sync_database_url, settings

# Alembic Config object
config = context.config

# Setup logging dari alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def _get_sqlalchemy_url():
    url = config.get_main_option("sqlalchemy.url")
    if not url or url.startswith("driver://"):
        return settings.sync_database_url
    return normalize_sync_database_url(url)

# Import semua model agar Alembic bisa detect perubahan (autogenerate)
from app.database import Base
from app.models.user import User          # noqa: F401
from app.models.message import Message    # noqa: F401
from app.models.health_record import HealthRecord  # noqa: F401
from app.models.patient_profile import PatientProfile  # noqa: F401
from app.models.consultation import Consultation  # noqa: F401
from app.models.home_visit import HomeVisit  # noqa: F401
from app.models.ambulance import AmbulanceService  # noqa: F401
from app.models.emergency import EmergencyRequest  # noqa: F401

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Jalankan migrations dalam mode 'offline'."""
    url = _get_sqlalchemy_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Jalankan migrations dalam mode 'online'."""
    url = _get_sqlalchemy_url()
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

