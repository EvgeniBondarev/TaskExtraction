from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.attachments import AttachmentOut


class MessageClassificationOut(BaseModel):
    status: str  # pending | prefilter_skip | no_signals | classified
    is_task: bool | None = None
    confidence: float | None = None
    ai_confidence: float | None = None
    heuristic_score: float | None = None
    threshold: float | None = None
    reason: str | None = None
    prefilter_reason: str | None = None
    skip_reason: str | None = None
    task_created: bool = False


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    chat_id: UUID
    telegram_message_id: int
    user_id: int | None
    user_display_name: str | None
    text: str | None
    reply_to_telegram_id: int | None
    media_path: str | None
    created_at: datetime
    telegram_link: str | None = None
    chat_title: str | None = None
    chat_avatar_url: str | None = None
    sender_avatar_url: str | None = None
    classification: MessageClassificationOut | None = None
    attachments: list[AttachmentOut] = []
    jira_issue_key: str | None = None
    jira_url: str | None = None
    trello_card_id: str | None = None
    trello_url: str | None = None
    github_issue_number: str | None = None
    github_url: str | None = None
    slack_message_id: str | None = None
    slack_url: str | None = None


class MessageList(BaseModel):
    items: list[MessageOut]
    total: int
    limit: int
    offset: int
