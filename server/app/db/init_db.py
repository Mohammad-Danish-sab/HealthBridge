import asyncio
from app.db.session import engine
from app.db.base import Base

async def init_db():
    async with engine.begin() as conn:
        print("Creating PostgreSQL tables for HealthBridge...")
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())