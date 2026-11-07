import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from jose import jwt, JWTError

from app.db.session import AsyncSessionLocal, get_db
from app.core.config import settings
from app.core.security import ALGORITHM
from app.models.user import User
from app.models.communication import ChatMessage, Notification
from app.schemas.communication import ChatMessageResponse, NotificationResponse
from app.services.websocket_manager import ws_manager
from app.api.deps import get_current_user

router = APIRouter(prefix="/communication", tags=["Communication & Realtime"])

async def get_ws_user(token: str) -> Optional[User]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == email))
            return result.scalars().first()
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

@router.get("/chat/history/{other_user_id}", response_model=List[ChatMessageResponse])
async def get_chat_history(
    other_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChatMessage)
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