"""trello integration config

Revision ID: 010
Revises: 009
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "trello_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("api_key", sa.String(128), nullable=True),
        sa.Column("token_encrypted", sa.Text(), nullable=True),
        sa.Column("board_id", sa.String(64), nullable=True),
        sa.Column("board_name", sa.String(255), nullable=True),
        sa.Column("list_id", sa.String(64), nullable=True),
        sa.Column("list_name", sa.String(255), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("auto_push", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("include_media", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("include_message_links", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("trello_config")
