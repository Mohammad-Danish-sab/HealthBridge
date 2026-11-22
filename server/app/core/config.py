from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url


SERVER_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthBridge API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_MIN_32_CHARS"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

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

    @property
    def database_url(self) -> URL:
        if self.DATABASE_URL:
            url = make_url(self.DATABASE_URL)
            if url.drivername == "postgresql":
                url = url.set(drivername="postgresql+asyncpg")
            elif url.drivername == "sqlite":
                url = url.set(drivername="sqlite+aiosqlite")

            if url.get_backend_name() == "sqlite" and url.database not in (None, ":memory:"):
                database = Path(url.database)
                if not database.is_absolute():
                    database = SERVER_ROOT / database
                url = url.set(database=str(database.resolve()))
            return url

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


settings = Settings()
