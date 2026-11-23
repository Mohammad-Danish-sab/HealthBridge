"""add direct chat fields

Revision ID: 4b2f8a1c9d30
Revises: fd7d5721c1ea
Create Date: 2026-11-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4b2f8a1c9d30"
down_revision: Union[str, None] = "fd7d5721c1ea"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("recipient_id", sa.Integer(), nullable=True))
    op.add_column("messages", sa.Column("appointment_id", sa.Integer(), nullable=True))
    op.alter_column("messages", "conversation_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(
        "fk_messages_recipient_id_users",
        "messages",
        "users",
        ["recipient_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_messages_appointment_id_appointments",
        "messages",
        "appointments",
        ["appointment_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_messages_appointment_id_appointments", "messages", type_="foreignkey")
    op.drop_constraint("fk_messages_recipient_id_users", "messages", type_="foreignkey")
    op.drop_column("messages", "appointment_id")
    op.drop_column("messages", "recipient_id")
    op.alter_column("messages", "conversation_id", existing_type=sa.Integer(), nullable=False)
