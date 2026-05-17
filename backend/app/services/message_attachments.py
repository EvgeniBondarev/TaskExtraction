from __future__ import annotations

import os
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.entities import Message, MessageAttachment
from app.utils.telegram_attachments import PreparedAttachment, attachment_abs_path


def persist_attachments(
    session: AsyncSession,
    message: Message,
    prepared: list[PreparedAttachment],
) -> list[MessageAttachment]:
    rows: list[MessageAttachment] = []
    for i, item in enumerate(prepared):
        row = MessageAttachment(
            message_id=message.id,
            kind=item.kind,
            file_name=item.file_name,
            stored_path=item.stored_path,
            mime_type=item.mime_type,
            file_size=item.file_size,
            url=item.url,
            meta=item.meta or None,
            sort_order=i,
        )
        session.add(row)
        rows.append(row)
    return rows


def message_has_attachments(message: Message) -> bool:
    attachments = getattr(message, "attachments", None)
    if attachments:
        return len(attachments) > 0
    if not message.media_path:
        return False
    settings = get_settings()
    if os.path.isabs(message.media_path):
        return os.path.isfile(message.media_path)
    return bool(attachment_abs_path(settings.media_dir, message.media_path))


def primary_media_path(message: Message) -> str | None:
    attachments = getattr(message, "attachments", None) or []
    for att in attachments:
        if att.stored_path:
            settings = get_settings()
            return attachment_abs_path(settings.media_dir, att.stored_path)
    if message.media_path:
        settings = get_settings()
        if os.path.isabs(message.media_path):
            return message.media_path
        return attachment_abs_path(settings.media_dir, message.media_path)
    return None
