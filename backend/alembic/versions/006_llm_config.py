"""llm user settings

Revision ID: 006
Revises: 005
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "llm_config",
        sa.Column("id", sa.Integer(), primary_key=True, default=1),
        sa.Column("user_api_key_encrypted", sa.Text(), nullable=True),
        sa.Column("user_model", sa.String(128), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
        ),
    )


def downgrade() -> None:
    op.drop_table("llm_config")
