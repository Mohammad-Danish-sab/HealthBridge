from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url


SERVER_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthBridge API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "test", "staging", "production"] = "development"
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_MIN_32_CHARS"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    RATE_LIMIT_STORAGE_URI: str = "memory://"

    POSTGRES_SERVER: str | None = None
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "healthbridge"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str | None = None

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    AI_PROVIDER_API_KEY: str | None = None
    AI_MODEL_NAME: str = "gpt-4o-mini"
    AI_MAX_TOKENS: int = 500

    model_config = SettingsConfigDict(
        env_file=SERVER_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.ENVIRONMENT != "production":
            return self

        if (
            len(self.SECRET_KEY) < 32
            or self.SECRET_KEY == "CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_MIN_32_CHARS"
        ):
            raise ValueError(
                "SECRET_KEY must be configured with at least 32 characters in production."
            )
        if self.database_url.get_backend_name() != "postgresql":
            raise ValueError("Production deployments must use PostgreSQL.")
        rate_limit_storage = urlsplit(self.RATE_LIMIT_STORAGE_URI)
        if (
            rate_limit_storage.scheme not in {"redis", "rediss"}
            or not rate_limit_storage.hostname
        ):
            raise ValueError(
                "Production deployments must configure a reachable Redis URL "
                "for rate-limit storage."
            )
        if not self.BACKEND_CORS_ORIGINS:
            raise ValueError("Configure BACKEND_CORS_ORIGINS for production.")
        if any(
            origin == "*"
            or not origin.startswith("https://")
            for origin in self.BACKEND_CORS_ORIGINS
        ):
            raise ValueError(
                "Production CORS origins must be explicit HTTPS origins."
            )
        return self

    @property
    def database_url(self) -> URL:
        if self.DATABASE_URL:
            url = make_url(self.DATABASE_URL)
            return self._normalize_database_url(url)

        if self.POSTGRES_DB.lower().startswith(("postgresql://", "postgres://")):
            return self._normalize_database_url(make_url(self.POSTGRES_DB))

        if self.POSTGRES_SERVER:
            return URL.create(
                drivername="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                database=self.POSTGRES_DB,
            )

        return URL.create(
            drivername="sqlite+aiosqlite",
            database=str(SERVER_ROOT / "healthbridge.db"),
        )

    def _normalize_database_url(self, url: URL) -> URL:
        if url.drivername in ("postgresql", "postgres"):
            url = url.set(drivername="postgresql+asyncpg")
            query = dict(url.query)
            sslmode = query.pop("sslmode", None)
            query.pop("channel_binding", None)
            if sslmode:
                query.setdefault("ssl", sslmode)
            url = url.set(query=query)
        elif url.drivername == "sqlite":
            url = url.set(drivername="sqlite+aiosqlite")

        if url.get_backend_name() == "sqlite" and url.database not in (None, ":memory:"):
            database = Path(url.database)
            if not database.is_absolute():
                database = SERVER_ROOT / database
            url = url.set(database=str(database.resolve()))
        return url


settings = Settings()
