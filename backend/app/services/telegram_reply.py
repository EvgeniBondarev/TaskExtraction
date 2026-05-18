"""Отправка ответа в исходный Telegram-чат по задаче."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entities import Message, Task
from app.services import telegram_auth
from app.utils.telegram_entity_resolve import resolve_chat_input_entity
from app.utils.telegram_link import build_telegram_message_link

logger = logging.getLogger(__name__)

_STATUS_RU = {
    "inbox": "Inbox",
    "in_progress": "В работе",
    "done": "Готово",
    "archive": "Архив",
}


def build_task_panel_url(task_id: UUID, panel_base: str | None) -> str:
    base = (panel_base or "").strip().rstrip("/")
    if not base:
        return f"/?task={task_id}"
    return f"{base}/?task={task_id}"


def build_default_reply_text(task: Task, panel_url: str) -> str:
    status = _STATUS_RU.get(task.status, task.status)
    lines = [f"📌 {task.title.strip()}", "", f"Статус: {status}"]
    if task.assignee:
        lines.append(f"Исполнитель: {task.assignee}")
    lines.extend(["", "↗ Карточка в TaskExtraction:", panel_url])
    return "\n".join(lines)


def _normalize_reply_text(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(400, "Текст ответа не может быть пустым")
    if len(cleaned) > 4096:
        raise HTTPException(400, "Слишком длинное сообщение (макс. 4096 символов)")
    return cleaned


async def send_task_reply(
    session: AsyncSession,
    task_id: UUID,
    text: str,
    panel_base: str | None = None,
) -> dict:
    result = await session.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(
            selectinload(Task.source_message).selectinload(Message.chat),
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    if not task.source_message or not task.source_message.chat:
        raise HTTPException(400, "У задачи нет исходного сообщения в Telegram")

    body = _normalize_reply_text(text)
    msg = task.source_message
    chat = msg.chat
    panel_url = build_task_panel_url(task.id, panel_base)
    if panel_url not in body:
        body = f"{body.rstrip()}\n\n{panel_url}"

    status = await telegram_auth.get_status()
    if not status.is_authorized:
        raise HTTPException(400, "Telegram не авторизован — войдите в настройках")

    client = await telegram_auth.get_client()
    if not client:
        raise HTTPException(400, "Не удалось подключиться к Telegram")

    try:
        peer = await resolve_chat_input_entity(client, chat, msg)
        sent = await client.send_message(
            peer,
            body,
            reply_to=msg.telegram_message_id,
            link_preview=True,
        )
    except Exception as exc:
        logger.exception("Telegram reply failed for task %s", task_id)
        raise HTTPException(400, f"Не удалось отправить в Telegram: {exc}") from exc

    sent_id = getattr(sent, "id", None) or msg.telegram_message_id
    link = build_telegram_message_link(chat.telegram_chat_id, sent_id)
    return {"ok": True, "telegram_link": link, "telegram_message_id": sent_id}
