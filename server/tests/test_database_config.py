from pathlib import Path

import pytest

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


def test_production_settings_require_strong_secret():
    with pytest.raises(ValueError, match="SECRET_KEY"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_MIN_32_CHARS",
            DATABASE_URL="postgresql://user:password@db.example.com/healthbridge",
            BACKEND_CORS_ORIGINS=["https://healthbridge.example.com"],
            _env_file=None,
        )


def test_production_settings_require_postgresql():
    with pytest.raises(ValueError, match="PostgreSQL"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="x" * 48,
            DATABASE_URL="sqlite:///healthbridge.db",
            BACKEND_CORS_ORIGINS=["https://healthbridge.example.com"],
            _env_file=None,
        )


def test_production_settings_reject_local_cors_origins():
    with pytest.raises(ValueError, match="CORS"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="x" * 48,
            DATABASE_URL="postgresql://user:password@db.example.com/healthbridge",
            BACKEND_CORS_ORIGINS=["http://localhost:5173"],
            _env_file=None,
        )


def test_production_settings_accept_explicit_secure_configuration():
    settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="x" * 48,
        DATABASE_URL="postgresql://user:password@db.example.com/healthbridge",
        BACKEND_CORS_ORIGINS=["https://healthbridge.example.com"],
        _env_file=None,
    )

    assert settings.ENVIRONMENT == "production"


def test_production_settings_reject_non_https_cors_origins():
    with pytest.raises(ValueError, match="HTTPS"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="x" * 48,
            DATABASE_URL="postgresql://user:password@db.example.com/healthbridge",
            BACKEND_CORS_ORIGINS=["http://healthbridge.example.com"],
            _env_file=None,
        )
