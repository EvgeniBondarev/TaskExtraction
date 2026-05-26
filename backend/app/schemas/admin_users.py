from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AdminUserRow(BaseModel):
    api_id: str
    display_name: str | None = None
    telegram_username: str | None = None
    telegram_first_name: str | None = None
    telegram_last_name: str | None = None
    telegram_phone: str | None = None
    telegram_user_id: int | None = None
    app_title: str | None = None
    has_credentials: bool = False
    is_authorized: bool = False
    monitored_chats: int = 0
    total_chats: int = 0
    tasks_count: int = 0
    messages_count: int = 0
    integrations: list[str] = Field(default_factory=list)
    registered_at: datetime | None = None
    updated_at: datetime | None = None
    last_message_at: datetime | None = None


class AdminUsersOut(BaseModel):
    total: int
    users: list[AdminUserRow]
