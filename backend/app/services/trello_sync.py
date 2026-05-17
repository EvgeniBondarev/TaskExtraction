"""Push tasks to Trello with description, links and file attachments."""

from __future__ import annotations

import logging
import os
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.entities import ExternalLink, Message, MessageAttachment, Task, TaskComment
from app.services.trello_client import TrelloClient, TrelloCredentials
from app.services.trello_settings import get_trello_config_row, get_trello_credentials
from app.utils.task_attachments import collect_task_attachments
from app.utils.telegram_attachments import attachment_abs_path
from app.utils.telegram_link import build_telegram_message_link
from app.utils.trello_description import build_card_description

logger = logging.getLogger(__name__)

_TASK_LOAD = (
    selectinload(Task.source_message).selectinload(Message.chat),
    selectinload(Task.source_message).selectinload(Message.attachments),
    selectinload(Task.comments).selectinload(TaskComment.message).selectinload(Message.attachments),
    selectinload(Task.external_links),
)


def _iter_attachment_rows(task: Task) -> list[MessageAttachment]:
    seen: set = set()
    rows: list[MessageAttachment] = []

    def add_from_message(message: Message | None) -> None:
        if not message:
            return
        for att in message.attachments or []:
            if att.id in seen:
                continue
            seen.add(att.id)
            rows.append(att)

    add_from_message(task.source_message)
    for comment in task.comments or []:
        add_from_message(comment.message)
    return rows


async def load_task_for_trello(session: AsyncSession, task_id: UUID) -> Task | None:
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD)
    )
    return result.scalar_one_or_none()


def _card_url(card: dict) -> str:
    return card.get("shortUrl") or card.get("url") or f"https://trello.com/c/{card.get('shortLink', '')}"


async def push_task_to_trello(session: AsyncSession, task: Task) -> ExternalLink | None:
    row = await get_trello_config_row()
    creds_tuple = await get_trello_credentials()
    if not row or not creds_tuple or not row.enabled:
        raise ValueError("Trello не настроен или отключён")

    if not row.list_id:
        raise ValueError("Выберите список (list) в настройках Trello")

    for link in task.external_links or []:
        if link.provider == "trello":
            return link

    api_key, token = creds_tuple
    client = TrelloClient(TrelloCredentials(api_key=api_key, token=token))

    msg = task.source_message
    chat = msg.chat if msg else None
    telegram_link = None
    if msg and chat:
        telegram_link = build_telegram_message_link(
            chat.telegram_chat_id, msg.telegram_message_id
        )

    attachment_outs = collect_task_attachments(task)
    attachment_lines: list[str] = []
    public_urls: list[tuple[str, str]] = []
    settings = get_settings()
    public_base = (settings.public_api_url or "").rstrip("/")

    for att in attachment_outs:
        label = att.file_name or att.label or att.kind
        if att.url and att.kind == "link":
            attachment_lines.append(f"Ссылка: {att.url}")
        elif att.download_url:
            if public_base:
                public_urls.append((label, f"{public_base}{att.download_url}"))
            attachment_lines.append(label)

    desc = build_card_description(
        description=task.description,
        task_type=task.type,
        priority=task.priority,
        confidence=task.confidence,
        telegram_link=telegram_link if row.include_message_links else None,
        sender_name=msg.user_display_name if msg else None,
        chat_title=chat.title if chat else None,
        message_text=msg.text if msg else None,
        attachment_lines=attachment_lines,
        public_attachment_urls=public_urls if row.include_message_links else [],
    )

    created = await client.create_card(
        list_id=row.list_id,
        name=task.title,
        desc=desc,
    )

    card_id = created.get("id", "")
    if not card_id:
        raise ValueError("Trello не вернул id карточки")

    if row.include_media:
        for att_row in _iter_attachment_rows(task):
            path = None
            if att_row.stored_path and att_row.kind != "link":
                from app.tenancy.media import effective_media_dir

                path = attachment_abs_path(effective_media_dir(), att_row.stored_path)
            if path and os.path.isfile(path):
                try:
                    await client.add_attachment_file(
                        card_id,
                        path,
                        att_row.file_name or os.path.basename(path),
                    )
                except Exception:
                    logger.exception("Trello file attachment failed for %s", att_row.id)
            elif att_row.url and att_row.kind == "link":
                try:
                    await client.add_attachment_url(
                        card_id,
                        att_row.url,
                        att_row.file_name or "link",
                    )
                except Exception:
                    logger.exception("Trello URL attachment failed for %s", att_row.id)

        if row.include_message_links:
            for label, url in public_urls:
                try:
                    await client.add_attachment_url(card_id, url, label)
                except Exception:
                    logger.exception("Trello public URL attachment failed: %s", url)

    ext = ExternalLink(
        task_id=task.id,
        provider="trello",
        external_id=card_id,
        url=_card_url(created),
    )
    session.add(ext)
    await session.flush()
    logger.info("Pushed task %s to Trello card %s", task.id, card_id)
    return ext


async def auto_push_if_enabled(session: AsyncSession, task_id: UUID) -> ExternalLink | None:
    row = await get_trello_config_row()
    if not row or not row.enabled or not row.auto_push:
        return None
    task = await load_task_for_trello(session, task_id)
    if not task:
        return None
    try:
        return await push_task_to_trello(session, task)
    except Exception:
        logger.exception("Trello auto-push failed for task %s", task_id)
        return None
