from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.attachments import AttachmentOut


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_message_id: UUID
    title: str
    description: str | None
    type: str
    priority: str
    status: str
    assignee: str | None
    confidence: float | None
    created_at: datetime
    updated_at: datetime
    telegram_link: str | None = None
    external_links: list["ExternalLinkOut"] = []
    attachments: list[AttachmentOut] = []
    source_user_display_name: str | None = None
    source_sender_avatar_url: str | None = None
    source_chat_title: str | None = None
    source_chat_avatar_url: str | None = None
    source_chat_type: str | None = None
    source_is_group: bool = False
    source_created_at: datetime | None = None


class ExternalLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: str
    external_id: str
    url: str


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: str | None = None
    priority: str | None = None
    status: str | None = None
    assignee: str | None = None


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: str | None = None
    type: str = "other"
    priority: str = "medium"
    source_message_id: UUID | None = None


class TaskList(BaseModel):
    items: list[TaskOut]
    total: int


class ExtractionResult(BaseModel):
    is_task: bool
    type: str = "other"
    title: str = ""
    description: str = ""
    priority: str = "medium"
    confidence: float = 0.0
