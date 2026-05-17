"""telegram_config table

Revision ID: 002
Revises: 001
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "telegram_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("api_id_encrypted", sa.Text(), nullable=True),
        sa.Column("api_hash_encrypted", sa.Text(), nullable=True),
        sa.Column("session_encrypted", sa.Text(), nullable=True),
        sa.Column("is_authorized", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("telegram_user_id", sa.BigInteger(), nullable=True),
        sa.Column("telegram_username", sa.String(255), nullable=True),
        sa.Column("monitor_chat_id", sa.BigInteger(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)")),
    )


def downgrade() -> None:
    op.drop_table("telegram_config")
