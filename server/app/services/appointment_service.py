from datetime import date, datetime, timedelta, time
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from app.models.doctor import DoctorProfile, DoctorAvailability, DayOfWeek
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import TimeSlot

async def get_available_slots(db: AsyncSession, doctor_id: int, target_date: date) -> List[TimeSlot]:
    # Determine day of week
    day_name = target_date.strftime("%A").upper()
    try:
        day_enum = DayOfWeek[day_name]
    except KeyError:
        return []

    # Get doctor availabilities for target day
    avail_result = await db.execute(
        select(DoctorAvailability).where(
            and_(
                DoctorAvailability.doctor_id == doctor_id,
                DoctorAvailability.day_of_week == day_enum
            )
        )
    )
    availabilities = avail_result.scalars().all()
    if not availabilities:
        return []

    # Get existing booked appointments for target date
    appt_result = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == target_date,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
            )
        )
    )
    existing_appointments = appt_result.scalars().all()
    booked_times = {(a.start_time, a.end_time) for a in existing_appointments}

    slots: List[TimeSlot] = []

    for avail in availabilities:
        current_dt = datetime.combine(target_date, avail.start_time)
        end_dt = datetime.combine(target_date, avail.end_time)
        slot_delta = timedelta(minutes=avail.slot_duration_minutes)

        while current_dt + slot_delta <= end_dt:
            slot_start = current_dt.time()
            slot_end = (current_dt + slot_delta).time()
            is_avail = (slot_start, slot_end) not in booked_times

            slots.append(TimeSlot(start_time=slot_start, end_time=slot_end, is_available=is_avail))
            current_dt += slot_delta

    return slots