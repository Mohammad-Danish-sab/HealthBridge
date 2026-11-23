import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError

from app.db.session import AsyncSessionLocal, get_db
from app.core.config import settings
from app.core.security import ALGORITHM
from app.models.user import User
from app.models.communication import ChatMessage, Notification
from app.models.appointment import Appointment
from app.models.user import UserRole
from app.models.doctor import DoctorProfile
from app.api.deps import RoleChecker
from app.schemas.communication import ChatMessageCreate, ChatMessageResponse, NotificationResponse
from app.services.websocket_manager import ws_manager
from app.api.deps import get_current_user
from app.services.notification_service import create_notification

router = APIRouter(prefix="/communication", tags=["Communication & Realtime"])
allow_chat_participants = RoleChecker([UserRole.PATIENT, UserRole.DOCTOR])

async def get_ws_user(token: str) -> User | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        async with AsyncSessionLocal() as db:
            user = await db.get(User, int(user_id))
            if user is None or not user.is_active:
                return None
            return user
    except (JWTError, TypeError, ValueError):
        return None


async def _has_chat_relationship(
    db: AsyncSession,
    first_user: User,
    second_user: User,
    appointment_id: int | None = None,
) -> bool:
    if first_user.role == UserRole.PATIENT and second_user.role == UserRole.DOCTOR:
        patient, doctor = first_user, second_user
    elif first_user.role == UserRole.DOCTOR and second_user.role == UserRole.PATIENT:
        patient, doctor = second_user, first_user
    else:
        return False

    relationship_query = (
        select(Appointment.id)
        .join(DoctorProfile, Appointment.doctor_id == DoctorProfile.id)
        .where(
            Appointment.patient_id == patient.id,
            DoctorProfile.user_id == doctor.id,
        )
    )
    if appointment_id is not None:
        relationship_query = relationship_query.where(
            Appointment.id == appointment_id
        )
    return await db.scalar(relationship_query.limit(1)) is not None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    user = await get_ws_user(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(user.id, websocket)
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = ChatMessageCreate.model_validate(json.loads(raw_data))
            except (json.JSONDecodeError, ValidationError, TypeError):
                await websocket.send_json(
                    {"type": "ERROR", "message": "Invalid chat message payload."}
                )
                continue

            async with AsyncSessionLocal() as db:
                recipient = await db.get(User, payload.recipient_id)
                if (
                    recipient is None
                    or not recipient.is_active
                    or not await _has_chat_relationship(
                        db, user, recipient, payload.appointment_id
                    )
                ):
                    await websocket.send_json(
                        {
                            "type": "ERROR",
                            "message": "Recipient not found or chat is not allowed.",
                        }
                    )
                    continue

                msg = ChatMessage(
                    sender_id=user.id,
                    recipient_id=recipient.id,
                    appointment_id=payload.appointment_id,
                    content=payload.content,
                )
                db.add(msg)
                await db.commit()
                await db.refresh(msg)
                out_payload = {
                    "type": "CHAT_MESSAGE",
                    "data": {
                        "id": msg.id,
                        "sender_id": user.id,
                        "recipient_id": recipient.id,
                        "appointment_id": payload.appointment_id,
                        "content": payload.content,
                        "timestamp": msg.timestamp.isoformat(),
                        "sender_name": user.full_name,
                    },
                }
                await create_notification(
                    db,
                    recipient.id,
                    "New message",
                    f"{user.full_name} sent you a message.",
                    "/notifications",
                )
                await ws_manager.send_personal_message(out_payload, recipient.id)
                await ws_manager.send_personal_message(out_payload, user.id)
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(user.id, websocket)


@router.post("/chat/send", response_model=ChatMessageResponse)
async def send_chat_message(
    message_in: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_chat_participants),
):
    recipient = await db.get(User, message_in.recipient_id)
    if recipient is None or not recipient.is_active:
        raise HTTPException(status_code=404, detail="Recipient not found.")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send a message to yourself.")

    if not await _has_chat_relationship(
        db, current_user, recipient, message_in.appointment_id
    ):
        raise HTTPException(
            status_code=403,
            detail="Chat is only allowed between a patient's own doctor and that patient.",
        )

    msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        appointment_id=message_in.appointment_id,
        content=message_in.content,
    )
    db.add(msg)
    await db.commit()
    result = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.sender))
        .where(ChatMessage.id == msg.id)
    )
    message = result.scalars().first()
    await create_notification(
        db,
        recipient.id,
        "New message",
        f"{current_user.full_name} sent you a message.",
        "/notifications",
    )
    event = {
        "type": "CHAT_MESSAGE",
        "data": {
            "id": message.id,
            "sender_id": current_user.id,
            "recipient_id": recipient.id,
            "appointment_id": message_in.appointment_id,
            "content": message_in.content,
            "timestamp": message.timestamp.isoformat(),
            "sender_name": current_user.full_name,
        },
    }
    await ws_manager.send_personal_message(event, recipient.id)
    await ws_manager.send_personal_message(event, current_user.id)
    return message

@router.get("/chat/history/{other_user_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
    other_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    other_user = await db.get(User, other_user_id)
    if (
        other_user is None
        or not other_user.is_active
        or other_user.id == current_user.id
        or not await _has_chat_relationship(db, current_user, other_user)
    ):
        raise HTTPException(status_code=404, detail="Chat not found.")

    result = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.sender))
        .where(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == other_user_id),
                and_(ChatMessage.sender_id == other_user_id, ChatMessage.recipient_id == current_user.id)
            )
        )
        .order_by(ChatMessage.timestamp.asc())
    )
    return result.scalars().all()

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    return result.scalars().all()

@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification).where(
            and_(Notification.id == notification_id, Notification.user_id == current_user.id)
        )
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif