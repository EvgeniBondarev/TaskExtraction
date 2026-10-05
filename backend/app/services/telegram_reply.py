"""Отправка ответа в исходный Telegram-чат по задаче."""

from __future__ import annotations

import logging
from urllib.parse import urlparse
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entities import Message, Task
from app.services.telegram_bot import send_message
from app.services.source_registry import status_notifications_enabled
from app.tenancy.context import get_current_tenant
from app.utils.telegram_link import build_telegram_message_link

logger = logging.getLogger(__name__)

_STATUS_RU = {
    "inbox": "Новые",
    "in_progress": "В работе",
    "done": "Готово",
    "archive": "Архив",
}

_STATUS_EVENT = {
    "inbox": "📥 Добавлено в новые",
    "in_progress": "🛠 В работе",
    "done": "✅ Выполнено",
    "archive": "🗄 Архивировано",
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


def build_status_change_text(task: Task, panel_url: str, previous_status: str | None = None) -> str:
    del panel_url
    if previous_status in {"done", "archive"}:
        if task.status == "in_progress":
            return "↩️ Возвращено в работу"
        if task.status == "inbox":
            return "↩️ Возвращено в новые"
    return _STATUS_EVENT.get(task.status, "🔄 Статус задачи изменён")


async def notify_status_change(
    task: Task, panel_base: str | None = None, previous_status: str | None = None
) -> bool:
    """Reply to the source Telegram message without making a board update fail."""
    if task.status == "archive" or not task.source_message or not task.source_message.chat:
        return False
    tenant = get_current_tenant()
    if tenant and not status_notifications_enabled(tenant):
        return False
    source = task.source_message
    panel_url = build_task_panel_url(task.id, panel_base)
    parsed_url = urlparse(panel_url)
    reply_markup = None
    if parsed_url.scheme == "https" and parsed_url.netloc:
        reply_markup = {
            "inline_keyboard": [[{
                "text": "Открыть карточку в TaskExtraction",
                "url": panel_url,
            }]]
        }
    try:
        await send_message(
            source.chat.telegram_chat_id,
            build_status_change_text(task, panel_url, previous_status),
            reply_to_message_id=source.telegram_message_id,
            business_connection_id=(source.raw or {}).get("business_connection_id"),
            reply_markup=reply_markup,
        )
        return True
    except Exception:
        logger.warning("Telegram status notification failed for task %s", task.id, exc_info=True)
        return False


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

    try:
        raw = msg.raw or {}
        sent = await send_message(
            chat.telegram_chat_id,
            body,
            reply_to_message_id=msg.telegram_message_id,
            business_connection_id=raw.get("business_connection_id"),
        )
    except Exception as exc:
        logger.exception("Telegram reply failed for task %s", task_id)
        raise HTTPException(400, f"Не удалось отправить в Telegram: {exc}") from exc

    sent_id = sent.get("message_id") or msg.telegram_message_id
    link = build_telegram_message_link(chat.telegram_chat_id, sent_id)
    return {"ok": True, "telegram_link": link, "telegram_message_id": sent_id}
