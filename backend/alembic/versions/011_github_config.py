"""github integration config

Revision ID: 011
Revises: 010
Create Date: 2026-05-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "github_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner", sa.String(128), nullable=True),
        sa.Column("repo", sa.String(128), nullable=True),
        sa.Column("token_encrypted", sa.Text(), nullable=True),
        sa.Column("default_labels", sa.JSON(), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("auto_push", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("include_media", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("include_message_links", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("use_type_labels", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("github_config")
