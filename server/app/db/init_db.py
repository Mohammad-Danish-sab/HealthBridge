import asyncio

from app.db.session import engine
from app.models.doctor import DoctorAvailability, DoctorProfile
from app.models.medical_record import LabReport, Prescription, PrescriptionItem
from app.models.appointment import Appointment
from app.models.user import Base, User


async def initialize_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(initialize_database())
