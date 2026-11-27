from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.pharmacy import Complaint
from app.models.user import User
from app.schemas.pharmacy import ComplaintCreate, ComplaintResponse


router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_in: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = Complaint(
        user_id=current_user.id,
        subject=complaint_in.subject.strip(),
        description=complaint_in.description.strip(),
    )
    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)
    return complaint


@router.get("/my", response_model=List[ComplaintResponse])
async def list_my_complaints(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Complaint)
        .where(Complaint.user_id == current_user.id)
        .order_by(Complaint.created_at.desc())
    )
    return result.scalars().all()
