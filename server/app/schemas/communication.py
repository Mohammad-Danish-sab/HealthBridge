from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.user import UserResponse

class ChatMessageCreate(BaseModel):
    recipient_id: int
    appointment_id: Optional[int] = None
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        content = value.strip()
        if not content:
            raise ValueError("Message content cannot be empty.")
        return content

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
