from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import RoleChecker, get_current_user
from app.db.session import get_db
from app.models.doctor import DoctorAvailability, DoctorProfile
from app.models.user import User, UserRole
from app.schemas.doctor import AvailabilityItem, DoctorProfileCreate, DoctorProfileResponse


router = APIRouter(prefix="/doctors", tags=["Doctors"])
_doctor_or_admin = RoleChecker([UserRole.DOCTOR, UserRole.ADMIN])


@router.get("/", response_model=list[DoctorProfileResponse])
async def list_doctors(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[DoctorProfile]:
    result = await db.scalars(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .where(DoctorProfile.is_approved.is_(True))
        .order_by(DoctorProfile.id)
    )
    return list(result.all())


@router.get("/me", response_model=DoctorProfileResponse)
async def read_my_profile(
    current_user: Annotated[User, Depends(_doctor_or_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DoctorProfile:
    profile = await db.scalar(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .where(DoctorProfile.user_id == current_user.id)
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return profile


@router.post(
    "/me",
    response_model=DoctorProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_my_profile(
    profile_in: DoctorProfileCreate,
    current_user: Annotated[User, Depends(_doctor_or_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DoctorProfile:
    existing = await db.scalar(
        select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="A doctor profile already exists.")
    profile = DoctorProfile(user_id=current_user.id, **profile_in.model_dump())
    db.add(profile)
    await db.commit()
    result = await db.scalar(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .where(DoctorProfile.id == profile.id)
    )
    if result is None:
        raise HTTPException(status_code=500, detail="The doctor profile could not be loaded.")
    return result


@router.put("/me/availability", response_model=list[AvailabilityItem])
async def replace_my_availability(
    items: list[AvailabilityItem],
    current_user: Annotated[User, Depends(_doctor_or_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AvailabilityItem]:
    profile = await db.scalar(
        select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Create a doctor profile first.")

    existing = await db.scalars(
        select(DoctorAvailability).where(DoctorAvailability.doctor_id == profile.id)
    )
    for availability in existing.all():
        await db.delete(availability)
    db.add_all(
        [
            DoctorAvailability(doctor_id=profile.id, **item.model_dump())
            for item in items
        ]
    )
    await db.commit()
    return items


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
async def read_doctor(
    doctor_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> DoctorProfile:
    profile = await db.scalar(
        select(DoctorProfile)
        .options(selectinload(DoctorProfile.user))
        .where(
            DoctorProfile.id == doctor_id,
            DoctorProfile.is_approved.is_(True),
        )
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return profile
