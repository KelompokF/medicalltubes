from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

# Alembic Config object
config = context.config

# Setup logging dari alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import semua model agar Alembic bisa detect perubahan (autogenerate)
from app.database import Base
from app.models.user import User          # noqa: F401
from app.models.message import Message    # noqa: F401
from app.models.health_record import HealthRecord  # noqa: F401

target_metadata = Base.metadata


def get_sync_url() -> str:
    """
    Ambil DATABASE_URL dari settings dan konversi ke sync driver
    (asyncpg → psycopg2) untuk keperluan Alembic.
    """
    from app.core.config import settings
    url = settings.DATABASE_URL
    if "+asyncpg" in url:
        url = url.replace("+asyncpg", "")
    return url


def run_migrations_offline() -> None:
    """
    Jalankan migrations dalam mode 'offline'.
    Tidak memerlukan koneksi aktif ke database.
    """
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Jalankan migrations dalam mode 'online'.
    Membuat engine dan menghubungkannya ke database.
    """
    url = get_sync_url()
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
