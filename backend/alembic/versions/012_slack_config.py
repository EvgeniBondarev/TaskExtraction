"""slack integration config

Revision ID: 012
Revises: 011
Create Date: 2026-05-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "slack_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("bot_token_encrypted", sa.Text(), nullable=True),
        sa.Column("channel_id", sa.String(32), nullable=True),
        sa.Column("channel_name", sa.String(255), nullable=True),
        sa.Column("workspace_name", sa.String(255), nullable=True),
        sa.Column("workspace_url", sa.String(512), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("auto_push", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("include_media", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("include_message_links", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("mention_channel", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("slack_config")
