"""chat monitoring fields

Revision ID: 004
Revises: 003
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("chats", sa.Column("is_monitored", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("chats", sa.Column("chat_type", sa.String(32), nullable=True))
    op.add_column("chats", sa.Column("username", sa.String(255), nullable=True))
    op.add_column("chats", sa.Column("photo_path", sa.String(512), nullable=True))
    op.add_column("chats", sa.Column("parent_telegram_chat_id", sa.BigInteger(), nullable=True))
    op.add_column(
        "chats",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)")),
    )
    op.create_index("ix_chats_is_monitored", "chats", ["is_monitored"])


def downgrade() -> None:
    op.drop_index("ix_chats_is_monitored", table_name="chats")
    op.drop_column("chats", "updated_at")
    op.drop_column("chats", "parent_telegram_chat_id")
    op.drop_column("chats", "photo_path")
    op.drop_column("chats", "username")
    op.drop_column("chats", "chat_type")
    op.drop_column("chats", "is_monitored")
