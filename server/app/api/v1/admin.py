from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, ConfigDict, Field

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor import DoctorProfile
from app.models.appointment import Appointment
from app.models.pharmacy import Order, AuditLog, Complaint, ComplaintStatus
from app.schemas.pharmacy import PlatformStats
from app.schemas.user import UserResponse
from app.services.audit import log_action
from app.api.deps import RoleChecker
from app.schemas.doctor import DoctorProfileResponse

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

allow_admin = RoleChecker([UserRole.ADMIN])


class ComplaintUpdate(BaseModel):
    status: ComplaintStatus
    resolution_notes: str | None = Field(default=None, max_length=4000)


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    subject: str
    description: str
    status: ComplaintStatus
    resolution_notes: str | None
    created_at: datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    details: str | None
    timestamp: datetime

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    patients_count = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.PATIENT)
    )
    doctors_count = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.DOCTOR)
    )
    verified_doctors_count = await db.scalar(
        select(func.count(DoctorProfile.id)).where(DoctorProfile.is_approved.is_(True))
    )
    appointments_count = await db.scalar(select(func.count(Appointment.id)))
    orders_count = await db.scalar(select(func.count(Order.id)))
    
    revenue = await db.scalar(select(func.sum(Order.total_amount))) or 0.0

    return {
        "total_patients": patients_count or 0,
        "total_doctors": doctors_count or 0,
        "verified_doctors": verified_doctors_count or 0,
        "total_appointments": appointments_count or 0,
        "total_orders": orders_count or 0,
        "total_revenue": revenue
    }

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.patch("/users/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_active_status(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Administrators cannot deactivate their own account.",
        )

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)

    await log_action(
        db, current_user.id, "TOGGLE_USER_STATUS", "User", user.id, f"Set active state to {user.is_active}"
    )
    return user


@router.get("/doctors", response_model=List[DoctorProfileResponse])
async def list_doctor_profiles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    result = await db.execute(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .order_by(DoctorProfile.id.asc())
    )
    return result.scalars().all()


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    limit = max(1, min(limit, 500))
    result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/complaints", response_model=List[ComplaintResponse])
async def list_complaints(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    result = await db.execute(
        select(Complaint).order_by(Complaint.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/complaints/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: int,
    update: ComplaintUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    complaint = await db.get(Complaint, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    complaint.status = update.status
    if update.resolution_notes is not None:
        complaint.resolution_notes = update.resolution_notes.strip() or None
    await db.commit()
    await db.refresh(complaint)
    await log_action(
        db,
        current_user.id,
        "UPDATE_COMPLAINT",
        "Complaint",
        complaint.id,
        f"Status set to {complaint.status.value}",
    )
    return complaint
