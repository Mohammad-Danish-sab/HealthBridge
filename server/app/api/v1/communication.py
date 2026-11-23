import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
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
from app.api.deps import RoleChecker
from app.schemas.communication import ChatMessageCreate, ChatMessageResponse, NotificationResponse
from app.services.websocket_manager import ws_manager
from app.api.deps import get_current_user

router = APIRouter(prefix="/communication", tags=["Communication & Realtime"])
allow_chat_participants = RoleChecker([UserRole.PATIENT, UserRole.DOCTOR])

async def get_ws_user(token: str) -> Optional[User]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        async with AsyncSessionLocal() as db:
            return await db.get(User, int(user_id))
    except JWTError:
        return None

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
            payload = json.loads(raw_data)

            recipient_id = payload.get("recipient_id")
            content = payload.get("content")
            appointment_id = payload.get("appointment_id")

            if recipient_id and content:
                if not isinstance(recipient_id, int):
                    await websocket.send_json({"type": "ERROR", "message": "A valid recipient_id is required."})
                    continue
                recipient = await _get_chat_recipient(user.id, recipient_id)
                if recipient is None:
                    await websocket.send_json({"type": "ERROR", "message": "Recipient not found or chat is not allowed."})
                    continue
                async with AsyncSessionLocal() as db:
                    msg = ChatMessage(
                        sender_id=user.id,
                        recipient_id=recipient_id,
                        appointment_id=appointment_id,
                        content=content
                    )
                    db.add(msg)
                    await db.commit()
                    await db.refresh(msg)

                    out_payload = {
                        "type": "CHAT_MESSAGE",
                        "data": {
                            "id": msg.id,
                            "sender_id": user.id,
                            "recipient_id": recipient_id,
                            "appointment_id": appointment_id,
                            "content": content,
                            "timestamp": msg.timestamp.isoformat(),
                            "sender_name": user.full_name
                        }
                    }

                    # Push to sender and recipient
                    await ws_manager.send_personal_message(out_payload, recipient_id)
                    await ws_manager.send_personal_message(out_payload, user.id)

    except WebSocketDisconnect:
        ws_manager.disconnect(user.id, websocket)
    except Exception:
        ws_manager.disconnect(user.id, websocket)


async def _get_chat_recipient(sender_id: int, recipient_id: int) -> User | None:
    async with AsyncSessionLocal() as db:
        recipient = await db.get(User, recipient_id)
        if recipient is None or not recipient.is_active:
            return None
        if recipient_id == sender_id:
            return None
        sender = await db.get(User, sender_id)
        if sender is None:
            return None
        if sender.role not in (UserRole.PATIENT, UserRole.DOCTOR):
            return None
        if recipient.role not in (UserRole.PATIENT, UserRole.DOCTOR):
            return None
        return recipient


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

    content = message_in.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    if message_in.appointment_id is not None:
        appointment = await db.get(Appointment, message_in.appointment_id)
        if appointment is None:
            raise HTTPException(status_code=404, detail="Appointment not found.")
        participant_ids = {appointment.patient_id}
        from app.models.doctor import DoctorProfile
        doctor = await db.get(DoctorProfile, appointment.doctor_id)
        if doctor is not None:
            participant_ids.add(doctor.user_id)
        if current_user.id not in participant_ids or recipient.id not in participant_ids:
            raise HTTPException(status_code=403, detail="Chat recipient is not a participant in this appointment.")

    msg = ChatMessage(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        appointment_id=message_in.appointment_id,
        content=content,
    )
    db.add(msg)
    await db.commit()
    result = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.sender))
        .where(ChatMessage.id == msg.id)
    )
    return result.scalars().first()

@router.get("/chat/history/{other_user_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
    other_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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