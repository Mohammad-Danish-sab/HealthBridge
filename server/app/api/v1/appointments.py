from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor import DoctorProfile
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    TimeSlot
)
from app.services.appointment_service import get_available_slots
from app.api.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/appointments", tags=["Appointments"])

allow_patient = RoleChecker([UserRole.PATIENT])
allow_doctor = RoleChecker([UserRole.DOCTOR])
allow_all = RoleChecker([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN])

@router.get("/slots", response_model=List[TimeSlot])
async def list_available_slots(
    doctor_id: int,
    target_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_available_slots(db, doctor_id, target_date)

@router.post("/book", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    booking_in: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_patient)
):
    # Verify doctor existence
    doc_res = await db.execute(select(DoctorProfile).where(DoctorProfile.id == booking_in.doctor_id))
    doctor = doc_res.scalars().first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    # Check collision
    collision_res = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.doctor_id == booking_in.doctor_id,
                Appointment.appointment_date == booking_in.appointment_date,
                Appointment.start_time == booking_in.start_time,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
            )
        )
    )
    if collision_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This slot has already been booked. Please choose another time."
        )

    appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=booking_in.doctor_id,
        appointment_date=booking_in.appointment_date,
        start_time=booking_in.start_time,
        end_time=booking_in.end_time,
        reason=booking_in.reason,
        status=AppointmentStatus.PENDING
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    # Re-query with eager relationships
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment.id)
    )
    return result.scalars().first()

@router.get("/my-appointments", response_model=List[AppointmentResponse])
async def get_my_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    query = select(Appointment)

    if current_user.role == UserRole.PATIENT:
        query = query.where(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        doc_res = await db.execute(select(DoctorProfile).where(DoctorProfile.user_id == current_user.id))
        doctor = doc_res.scalars().first()
        if not doctor:
            return []
        query = query.where(Appointment.doctor_id == doctor.id)

    query = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    status_in: AppointmentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalars().first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    appointment.status = status_in.status
    if status_in.cancellation_reason:
        appointment.cancellation_reason = status_in.cancellation_reason

    await db.commit()
    await db.refresh(appointment)
    return appointment