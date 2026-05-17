from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    telegram_chat_id: int
    title: str | None
    is_monitored: bool
    chat_type: str | None
    username: str | None
    parent_telegram_chat_id: int | None
    has_photo: bool = False
    created_at: datetime
    updated_at: datetime | None = None


class ChatList(BaseModel):
    items: list[ChatOut]
    total: int
    monitored_count: int


class ChatStatusOut(BaseModel):
    monitored_count: int
    total_count: int
    has_monitored: bool


class ChatSyncOut(BaseModel):
    synced: int
    items: list[ChatOut]


class ChatSelectionIn(BaseModel):
    telegram_chat_ids: list[int] = Field(default_factory=list)
