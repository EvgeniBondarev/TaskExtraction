"""telegram profile and app metadata columns

Revision ID: 003
Revises: 002
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("telegram_config", sa.Column("app_title_encrypted", sa.Text(), nullable=True))
    op.add_column("telegram_config", sa.Column("app_short_name_encrypted", sa.Text(), nullable=True))
    op.add_column("telegram_config", sa.Column("app_metadata_encrypted", sa.Text(), nullable=True))
    op.add_column("telegram_config", sa.Column("user_profile_encrypted", sa.Text(), nullable=True))
    op.add_column("telegram_config", sa.Column("telegram_first_name", sa.String(255), nullable=True))
    op.add_column("telegram_config", sa.Column("telegram_last_name", sa.String(255), nullable=True))
    op.add_column("telegram_config", sa.Column("telegram_phone", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("telegram_config", "telegram_phone")
    op.drop_column("telegram_config", "telegram_last_name")
    op.drop_column("telegram_config", "telegram_first_name")
    op.drop_column("telegram_config", "user_profile_encrypted")
    op.drop_column("telegram_config", "app_metadata_encrypted")
    op.drop_column("telegram_config", "app_short_name_encrypted")
    op.drop_column("telegram_config", "app_title_encrypted")
