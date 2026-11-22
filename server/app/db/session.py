from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.user import Base


engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=settings.database_url.get_backend_name() != "sqlite",
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
AsyncSessionLocal = SessionLocal


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
