from pathlib import Path

from app.core.config import SERVER_ROOT, Settings


def test_default_database_url_uses_server_sqlite_file():
    settings = Settings(_env_file=None)

    assert settings.database_url.drivername == "sqlite+aiosqlite"
    assert Path(settings.database_url.database) == SERVER_ROOT / "healthbridge.db"


def test_explicit_database_url_uses_async_driver():
    settings = Settings(
        DATABASE_URL="postgresql://user:password@localhost/healthbridge",
        _env_file=None,
    )

    assert settings.database_url.drivername == "postgresql+asyncpg"
    assert settings.database_url.database == "healthbridge"


def test_postgres_settings_build_async_database_url():
    settings = Settings(
        POSTGRES_SERVER="db",
        POSTGRES_USER="user",
        POSTGRES_PASSWORD="password",
        POSTGRES_DB="healthbridge",
        _env_file=None,
    )

    assert settings.database_url.drivername == "postgresql+asyncpg"
    assert settings.database_url.host == "db"


def test_postgres_db_url_setting_uses_async_driver():
    settings = Settings(
        POSTGRES_DB="postgresql://user:password@db.example.com/healthbridge?"
        "sslmode=require&channel_binding=require",
        _env_file=None,
    )

    url = settings.database_url
    assert url.drivername == "postgresql+asyncpg"
    assert url.host == "db.example.com"
    assert url.database == "healthbridge"
    assert url.query["ssl"] == "require"
    assert "sslmode" not in url.query
