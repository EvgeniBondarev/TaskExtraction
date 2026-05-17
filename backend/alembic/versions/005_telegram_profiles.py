"""telegram user profiles for avatars

Revision ID: 005
Revises: 004
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "telegram_profiles",
        sa.Column("telegram_user_id", sa.BigInteger(), primary_key=True),
        sa.Column("display_name", sa.String(255), nullable=True),
        sa.Column("photo_path", sa.String(512), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
        ),
    )


def downgrade() -> None:
    op.drop_table("telegram_profiles")
