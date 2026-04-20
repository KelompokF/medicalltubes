from logging.config import fileConfig

from sqlalchemy import engine_from_config, create_engine
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Allow reading DATABASE_URL from app settings (supports async URL from app)
from app.core.config import settings

def _get_sqlalchemy_url():
    url = config.get_main_option("sqlalchemy.url")
    if not url or url.startswith("driver://"):
        url = settings.DATABASE_URL
    # Alembic/create_engine expects a sync dialect URL; convert asyncpg URL if present
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("+asyncpg", "")
    return url

# add your model's MetaData object here
# for 'autogenerate' support
from app.database import Base
from app.models.user import User
from app.models.message import Message
from app.models.health_record import HealthRecord

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
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
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # create engine directly to avoid config interpolation issues
    connectable = create_engine(_get_sqlalchemy_url(), poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
