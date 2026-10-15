from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.pharmacy import AuditLog

async def log_action(
    db: AsyncSession,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[str] = None
):
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(log_entry)
    await db.commit()