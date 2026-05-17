"""LLM prompts and thresholds in llm_config

Revision ID: 007
Revises: 006
Create Date: 2026-05-16

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("llm_config", sa.Column("classifier_system_prompt", sa.Text(), nullable=True))
    op.add_column("llm_config", sa.Column("extractor_system_prompt", sa.Text(), nullable=True))
    op.add_column("llm_config", sa.Column("extractor_user_template", sa.Text(), nullable=True))
    op.add_column("llm_config", sa.Column("confidence_threshold", sa.Float(), nullable=True))
    op.add_column("llm_config", sa.Column("review_threshold", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("llm_config", "review_threshold")
    op.drop_column("llm_config", "confidence_threshold")
    op.drop_column("llm_config", "extractor_user_template")
    op.drop_column("llm_config", "extractor_system_prompt")
    op.drop_column("llm_config", "classifier_system_prompt")
