from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


def normalize_database_url(url: str) -> str:
    """Return a SQLAlchemy asyncpg URL, accepting common Supabase URL formats."""
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url.removeprefix("postgres://")
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url.removeprefix("postgresql://")

    parts = urlsplit(url)
    query_pairs = parse_qsl(parts.query, keep_blank_values=True)
    if not query_pairs:
        return url

    has_ssl = any(key == "ssl" for key, _ in query_pairs)
    normalized_query = []
    for key, value in query_pairs:
        if key == "sslmode":
            if not has_ssl:
                normalized_query.append(("ssl", value))
            continue
        normalized_query.append((key, value))

    return urlunsplit(parts._replace(query=urlencode(normalized_query)))


def normalize_sync_database_url(url: str) -> str:
    """Return a sync PostgreSQL URL for Alembic from any accepted app DB URL."""
    return normalize_database_url(url).replace(
        "postgresql+asyncpg://",
        "postgresql://",
        1,
    )


def get_database_connection_hint(url: str) -> str | None:
    """Return an operator-facing hint for known database URL failure modes."""
    host = urlsplit(normalize_database_url(url)).hostname or ""
    if host.startswith("db.") and host.endswith(".supabase.co"):
        return (
            "DATABASE_URL is using Supabase Direct connection, which requires IPv6. "
            "For local Windows or IPv4-only networks, replace it with the Supabase "
            "Session Pooler URL from Dashboard > Connect."
        )
    return None

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"))

    @property
    def async_database_url(self) -> str:
        return normalize_database_url(self.DATABASE_URL)

    @property
    def sync_database_url(self) -> str:
        return normalize_sync_database_url(self.DATABASE_URL)

settings = Settings()
