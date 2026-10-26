from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor import DoctorProfile
from app.models.appointment import Appointment
from app.models.pharmacy import Order, AuditLog
from app.schemas.pharmacy import PlatformStats
from app.schemas.user import UserResponse
from app.services.audit import log_action
from app.api.deps import RoleChecker

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

allow_admin = RoleChecker([UserRole.ADMIN])

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
        select(func.count(DoctorProfile.id)).where(DoctorProfile.is_verified == True)
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

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)

    await log_action(
        db, current_user.id, "TOGGLE_USER_STATUS", "User", user.id, f"Set active state to {user.is_active}"
    )
    return user