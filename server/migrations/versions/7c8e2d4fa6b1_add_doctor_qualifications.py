"""add doctor qualifications

Revision ID: 7c8e2d4fa6b1
Revises: 4b2f8a1c9d30
Create Date: 2026-11-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7c8e2d4fa6b1"
down_revision: Union[str, None] = "4b2f8a1c9d30"
depends_on: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("doctor_profiles") as batch_op:
        batch_op.add_column(
            sa.Column(
                "qualifications",
                sa.String(length=500),
                nullable=False,
                server_default="",
            )
        )
        batch_op.alter_column(
            "qualifications",
            existing_type=sa.String(length=500),
            server_default=None,
        )


def downgrade() -> None:
    with op.batch_alter_table("doctor_profiles") as batch_op:
        batch_op.drop_column("qualifications")
