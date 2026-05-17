"""jira integration config

Revision ID: 009
Revises: 008
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "jira_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("base_url", sa.String(512), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("api_token_encrypted", sa.Text(), nullable=True),
        sa.Column("project_key", sa.String(32), nullable=True),
        sa.Column("project_name", sa.String(255), nullable=True),
        sa.Column("issue_type_id", sa.String(32), nullable=True),
        sa.Column("issue_type_name", sa.String(128), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("auto_push", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("include_media", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("include_message_links", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
        ),
    )


def downgrade() -> None:
    op.drop_table("jira_config")
