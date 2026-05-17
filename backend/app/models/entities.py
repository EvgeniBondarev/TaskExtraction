from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy import JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TaskType(str, enum.Enum):
    bug = "bug"
    feature = "feature"
    question = "question"
    other = "other"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskStatus(str, enum.Enum):
    inbox = "inbox"
    in_progress = "in_progress"
    done = "done"
    archive = "archive"


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    telegram_chat_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_monitored: Mapped[bool] = mapped_column(default=False, index=True)
    chat_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    parent_telegram_chat_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages: Mapped[list["Message"]] = relationship(back_populates="chat")


class TelegramProfile(Base):
    __tablename__ = "telegram_profiles"

    telegram_user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (UniqueConstraint("chat_id", "telegram_message_id", name="uq_chat_telegram_message"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chats.id"), index=True)
    telegram_message_id: Mapped[int] = mapped_column(BigInteger)
    user_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    user_display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reply_to_telegram_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    media_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    raw: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chat: Mapped["Chat"] = relationship(back_populates="messages")
    task: Mapped[Optional["Task"]] = relationship(back_populates="source_message", uselist=False)
    attachments: Mapped[list["MessageAttachment"]] = relationship(
        back_populates="message",
        cascade="all, delete-orphan",
        order_by="MessageAttachment.sort_order",
    )


class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("messages.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    file_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    stored_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    message: Mapped["Message"] = relationship(back_populates="attachments")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    source_message_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("messages.id"), unique=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(32), default=TaskType.other.value)
    priority: Mapped[str] = mapped_column(String(16), default=TaskPriority.medium.value)
    status: Mapped[str] = mapped_column(String(32), default=TaskStatus.inbox.value, index=True)
    assignee: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    source_message: Mapped["Message"] = relationship(back_populates="task")
    comments: Mapped[list["TaskComment"]] = relationship(back_populates="task", cascade="all, delete-orphan")
    external_links: Mapped[list["ExternalLink"]] = relationship(back_populates="task", cascade="all, delete-orphan")


class TaskComment(Base):
    __tablename__ = "task_comments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id"), index=True)
    message_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("messages.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    task: Mapped["Task"] = relationship(back_populates="comments")
    message: Mapped[Optional["Message"]] = relationship(foreign_keys=[message_id])


class ExternalLink(Base):
    __tablename__ = "external_links"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id"), index=True)
    provider: Mapped[str] = mapped_column(String(32))
    external_id: Mapped[str] = mapped_column(String(128))
    url: Mapped[str] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    task: Mapped["Task"] = relationship(back_populates="external_links")


class TaskFeedback(Base):
    __tablename__ = "task_feedback"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id"), index=True)
    reason: Mapped[str] = mapped_column(String(64), default="not_a_task")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LlmConfig(Base):
    """Singleton (id=1): optional user OpenRouter API key and model override."""

    __tablename__ = "llm_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    user_api_key_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user_model: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    classifier_system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extractor_system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extractor_user_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_threshold: Mapped[Optional[float]] = mapped_column(nullable=True)
    review_threshold: Mapped[Optional[float]] = mapped_column(nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SlackConfig(Base):
    """Singleton (id=1): Slack integration."""

    __tablename__ = "slack_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    bot_token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    channel_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    channel_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    workspace_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    workspace_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    enabled: Mapped[bool] = mapped_column(default=False)
    auto_push: Mapped[bool] = mapped_column(default=False)
    include_media: Mapped[bool] = mapped_column(default=True)
    include_message_links: Mapped[bool] = mapped_column(default=True)
    mention_channel: Mapped[bool] = mapped_column(default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TrelloConfig(Base):
    """Singleton (id=1): Trello integration."""

    __tablename__ = "trello_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    api_key: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    board_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    board_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    list_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    list_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    enabled: Mapped[bool] = mapped_column(default=False)
    auto_push: Mapped[bool] = mapped_column(default=False)
    include_media: Mapped[bool] = mapped_column(default=True)
    include_message_links: Mapped[bool] = mapped_column(default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class GitHubConfig(Base):
    """Singleton (id=1): GitHub Issues integration."""

    __tablename__ = "github_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    owner: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    repo: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_labels: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    enabled: Mapped[bool] = mapped_column(default=False)
    auto_push: Mapped[bool] = mapped_column(default=False)
    include_media: Mapped[bool] = mapped_column(default=True)
    include_message_links: Mapped[bool] = mapped_column(default=True)
    use_type_labels: Mapped[bool] = mapped_column(default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class JiraConfig(Base):
    """Singleton (id=1): Jira Cloud integration."""

    __tablename__ = "jira_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    base_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    api_token_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    project_key: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    project_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    issue_type_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    issue_type_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    enabled: Mapped[bool] = mapped_column(default=False)
    auto_push: Mapped[bool] = mapped_column(default=False)
    include_media: Mapped[bool] = mapped_column(default=True)
    include_message_links: Mapped[bool] = mapped_column(default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TelegramConfig(Base):
    """Singleton (id=1): encrypted API keys, session, app and user metadata."""

    __tablename__ = "telegram_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    api_id_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    api_hash_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    app_title_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    app_short_name_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    app_metadata_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user_profile_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_authorized: Mapped[bool] = mapped_column(default=False)
    telegram_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telegram_first_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telegram_last_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telegram_phone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    monitor_chat_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
