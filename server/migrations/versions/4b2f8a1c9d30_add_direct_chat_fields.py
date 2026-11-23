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
    with op.batch_alter_table("messages") as batch_op:
        batch_op.add_column(sa.Column("recipient_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("appointment_id", sa.Integer(), nullable=True))
        batch_op.alter_column(
            "conversation_id",
            existing_type=sa.Integer(),
            nullable=True,
        )
        batch_op.create_foreign_key(
            "fk_messages_recipient_id_users",
            "users",
            ["recipient_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch_op.create_foreign_key(
            "fk_messages_appointment_id_appointments",
            "appointments",
            ["appointment_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    if op.get_bind().scalar(
        sa.text("SELECT 1 FROM messages WHERE conversation_id IS NULL LIMIT 1")
    ):
        raise RuntimeError(
            "Cannot downgrade while direct chat messages have no conversation_id."
        )

    with op.batch_alter_table("messages") as batch_op:
        batch_op.drop_constraint(
            "fk_messages_appointment_id_appointments",
            type_="foreignkey",
        )
        batch_op.drop_constraint(
            "fk_messages_recipient_id_users",
            type_="foreignkey",
        )
        batch_op.drop_column("appointment_id")
        batch_op.drop_column("recipient_id")
        batch_op.alter_column(
            "conversation_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
