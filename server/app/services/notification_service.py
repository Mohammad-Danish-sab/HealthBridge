from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.communication import Notification
from app.services.websocket_manager import ws_manager

async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    link: Optional[str] = None
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    await ws_manager.send_personal_message(
        {
            "type": "NOTIFICATION",
            "data": {
                "id": notification.id,
                "title": title,
                "message": message,
                "link": link,
                "created_at": notification.created_at.isoformat()
            }
        },
        user_id=user_id
    )
    return notification