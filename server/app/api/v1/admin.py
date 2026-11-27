from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.doctor import DoctorAvailability, DoctorProfile
from app.models.appointment import Appointment
from app.models.pharmacy import Order, AuditLog, Complaint, ComplaintStatus
from app.schemas.pharmacy import PlatformStats
from app.schemas.user import UserResponse
from app.services.audit import log_action
from app.api.deps import RoleChecker
from app.schemas.doctor import DoctorProfileResponse
from app.schemas.doctor import AvailabilityItem, DoctorProfileCreate
from app.api.deps import hash_password

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


class AdminUserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    role: Literal[UserRole.PATIENT, UserRole.ADMIN] = UserRole.PATIENT


class AdminDoctorCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    profile: DoctorProfileCreate


class AdminDoctorUpdate(BaseModel):
    specialization: str | None = Field(default=None, min_length=1, max_length=150)
    license_number: str | None = Field(default=None, min_length=1, max_length=100)
    qualifications: str | None = Field(default=None, max_length=500)
    experience_years: int | None = Field(default=None, ge=0)
    bio: str | None = None
    consultation_fee: float | None = Field(default=None, ge=0)


def _normalize_email(email: str) -> str:
    email = email.strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=422, detail="A valid email address is required.")
    return email


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    payload: AdminUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    email = _normalize_email(payload.email)
    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=422, detail="A full name is required.")
    if await db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from exc
    await db.refresh(user)
    await log_action(db, current_user.id, "CREATE_USER", "User", user.id, f"Created {user.role.value} account")
    return user


@router.post("/doctors", response_model=DoctorProfileResponse, status_code=201)
async def create_doctor(
    payload: AdminDoctorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    email = _normalize_email(payload.email)
    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=422, detail="A full name is required.")
    if await db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    profile_data = payload.profile.model_dump()
    profile_data["specialization"] = profile_data["specialization"].strip()
    profile_data["license_number"] = profile_data["license_number"].strip()
    profile_data["qualifications"] = (profile_data["qualifications"] or "").strip()
    if not profile_data["specialization"] or not profile_data["license_number"]:
        raise HTTPException(
            status_code=422,
            detail="Doctor specialization and license number are required.",
        )

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(payload.password),
        role=UserRole.DOCTOR,
    )
    profile = DoctorProfile(user=user, **profile_data, is_approved=False)
    db.add(profile)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="The account email or doctor license number is already in use.",
        ) from exc

    result = await db.scalar(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .where(DoctorProfile.id == profile.id)
    )
    if result is None:
        raise HTTPException(status_code=500, detail="The doctor profile could not be loaded.")
    await log_action(
        db, current_user.id, "CREATE_DOCTOR", "DoctorProfile", result.id,
        "Created doctor profile pending credential verification",
    )
    return result


@router.patch("/doctors/{doctor_id}", response_model=DoctorProfileResponse)
async def update_doctor(
    doctor_id: int,
    payload: AdminDoctorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    profile = await db.scalar(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .where(DoctorProfile.id == doctor_id)
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    changes = payload.model_dump(exclude_unset=True)
    if "specialization" in changes:
        changes["specialization"] = changes["specialization"].strip()
    if "license_number" in changes:
        changes["license_number"] = changes["license_number"].strip()
    if "qualifications" in changes and changes["qualifications"] is not None:
        changes["qualifications"] = changes["qualifications"].strip()
    elif "qualifications" in changes:
        changes["qualifications"] = ""
    for field in ("specialization", "license_number"):
        if field in changes and not changes[field]:
            raise HTTPException(status_code=422, detail=f"{field} cannot be blank.")
    for field, value in changes.items():
        setattr(profile, field, value)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="That doctor license number is already in use.") from exc
    await log_action(
        db, current_user.id, "UPDATE_DOCTOR_PROFILE", "DoctorProfile", profile.id,
        "Updated doctor profile",
    )
    result = await db.scalar(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .where(DoctorProfile.id == profile.id)
    )
    if result is None:
        raise HTTPException(status_code=500, detail="The doctor profile could not be loaded.")
    return result


@router.get("/doctors/{doctor_id}/availability", response_model=list[AvailabilityItem])
async def get_doctor_availability(
    doctor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    profile = await db.get(DoctorProfile, doctor_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return list(
        (await db.scalars(
            select(DoctorAvailability)
            .where(DoctorAvailability.doctor_id == doctor_id)
            .order_by(DoctorAvailability.day_of_week, DoctorAvailability.start_time)
        )).all()
    )


@router.put("/doctors/{doctor_id}/availability", response_model=list[AvailabilityItem])
async def set_doctor_availability(
    doctor_id: int,
    items: list[AvailabilityItem],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin),
):
    profile = await db.get(DoctorProfile, doctor_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    existing = await db.scalars(
        select(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor_id)
    )
    for item in existing.all():
        await db.delete(item)
    db.add_all(
        [
            DoctorAvailability(doctor_id=doctor_id, **item.model_dump())
            for item in items
        ]
    )
    await db.commit()
    await log_action(
        db, current_user.id, "UPDATE_DOCTOR_AVAILABILITY", "DoctorProfile", doctor_id,
        f"Replaced availability with {len(items)} schedule entries",
    )
    return items

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
