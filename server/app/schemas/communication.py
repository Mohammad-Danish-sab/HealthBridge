from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse

class ChatMessageCreate(BaseModel):
    recipient_id: int
    appointment_id: Optional[int] = None
    content: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: Optional[int] = None
    appointment_id: Optional[int] = None
    content: str
    is_read: bool
    timestamp: datetime
    sender: UserResponse


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
