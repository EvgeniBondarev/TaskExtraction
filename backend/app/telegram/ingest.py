import logging
import os
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from telethon.tl.types import User

from app.config import get_settings
from app.tenancy.context import require_current_tenant
from app.tenancy.media import effective_media_dir
from app.tenancy.registry import tenant_session
from app.extraction.pipeline import process_message
from app.models.entities import Chat, Message, Task, TelegramProfile
from app.services import chat_sync, telegram_auth
from app.services.avatars import ensure_chat_avatar, ensure_user_profile
from app.services.message_attachments import persist_attachments
from app.services.task_broadcast import load_task_for_broadcast
from app.utils.message_media import chat_avatar_url, sender_avatar_url
from app.utils.telegram_attachments import download_message_attachments
from app.utils.telegram_ids import chat_id_matches, normalize_telegram_chat_id
from app.utils.telegram_link import build_telegram_message_link

logger = logging.getLogger(__name__)

_ws_broadcast = None


def set_ws_broadcast(callback):
    global _ws_broadcast
    _ws_broadcast = callback


async def get_monitored_chat_ids() -> list[int]:
    ids = await chat_sync.get_monitored_telegram_ids()
    if ids:
        return ids
    row = await telegram_auth.get_config_row()
    if row and row.monitor_chat_id:
        return [row.monitor_chat_id]
    settings = get_settings()
    if settings.telegram_chat_id:
        return [settings.telegram_chat_id]
    return []


async def ensure_chat(session: AsyncSession, telegram_chat_id: int) -> Chat | None:
    result = await session.execute(
        select(Chat).where(
            Chat.telegram_chat_id == telegram_chat_id,
            Chat.is_monitored.is_(True),
        )
    )
    chat = result.scalar_one_or_none()
    if chat:
        return chat
    result = await session.execute(select(Chat).where(Chat.telegram_chat_id == telegram_chat_id))
    chat = result.scalar_one_or_none()
    if chat:
        chat.is_monitored = True
        await session.flush()
        return chat
    chat = Chat(telegram_chat_id=telegram_chat_id, title=f"Chat {telegram_chat_id}", is_monitored=True)
    session.add(chat)
    await session.flush()
    return chat


async def store_message(
    session: AsyncSession, chat: Chat, tg_message
) -> tuple[Message | None, TelegramProfile | None]:
    existing = await session.execute(
        select(Message).where(
            Message.chat_id == chat.id,
            Message.telegram_message_id == tg_message.id,
        )
    )
    if existing.scalar_one_or_none():
        return None, None

    client = await telegram_auth.get_client()
    await ensure_chat_avatar(session, client, chat, chat.telegram_chat_id)

    profile = None
    user_display = None
    if tg_message.sender_id:
        profile = await ensure_user_profile(session, client, tg_message.sender_id)
        if profile and profile.display_name:
            user_display = profile.display_name
        else:
            try:
                entity = await client.get_entity(tg_message.sender_id)
                if isinstance(entity, User):
                    user_display = entity.first_name or entity.username
            except Exception:
                pass

    reply_to = None
    if tg_message.reply_to and tg_message.reply_to.reply_to_msg_id:
        reply_to = tg_message.reply_to.reply_to_msg_id

    media_dir = effective_media_dir()
    os.makedirs(media_dir, exist_ok=True)

    msg = Message(
        chat_id=chat.id,
        telegram_message_id=tg_message.id,
        user_id=tg_message.sender_id,
        user_display_name=user_display,
        text=tg_message.text,
        reply_to_telegram_id=reply_to,
        media_path=None,
        raw={
            "message_id": tg_message.id,
            "chat_id": tg_message.chat_id,
            "classification": {"status": "processing"},
        },
        created_at=tg_message.date or datetime.now(timezone.utc),
    )
    session.add(msg)
    await session.flush()

    try:
        prepared = await download_message_attachments(client, tg_message, media_dir)
        if prepared:
            rows = persist_attachments(session, msg, prepared)
            await session.flush()
            if rows and rows[0].stored_path:
                from app.utils.telegram_attachments import attachment_abs_path as _abs

                msg.media_path = _abs(media_dir, rows[0].stored_path)
    except Exception:
        logger.exception("Attachment save failed for message %s", msg.id)

    await session.flush()
    return msg, profile


def _ws_payload(
    msg: Message,
    chat: Chat,
    profile: TelegramProfile | None,
    *,
    event_type: str,
    task_id: str | None = None,
    task_payload: dict | None = None,
    processing: bool = False,
) -> dict:
    return {
        "type": event_type,
        "processing": processing,
        "message_id": str(msg.id),
        "task_id": task_id,
        "task": task_payload,
        "chat_title": chat.title,
        "chat_id": str(chat.id),
        "telegram_chat_id": chat.telegram_chat_id,
        "user_display_name": msg.user_display_name,
        "text": msg.text,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
        "chat_avatar_url": chat_avatar_url(chat),
        "sender_avatar_url": sender_avatar_url(msg.user_id, profile),
        "telegram_link": build_telegram_message_link(
            chat.telegram_chat_id, msg.telegram_message_id
        ),
    }


async def _broadcast(payload: dict) -> None:
    if not _ws_broadcast:
        return
    try:
        await _ws_broadcast(payload, require_current_tenant())
    except Exception:
        logger.exception("WebSocket broadcast failed for message %s", payload.get("message_id"))


async def _mark_classification_error(message_id: UUID, reason: str) -> None:
    async with tenant_session() as session:
        msg = await session.get(Message, message_id)
        if not msg:
            return
        msg.raw = msg.raw or {}
        msg.raw["classification"] = {"status": "error", "reason": reason[:200]}
        flag_modified(msg, "raw")
        await session.commit()


async def handle_new_message(tg_message):
    telegram_chat_id = normalize_telegram_chat_id(tg_message.chat_id)
    monitored = await get_monitored_chat_ids()
    if monitored:
        monitored_set = {normalize_telegram_chat_id(i) for i in monitored}
        if not chat_id_matches(telegram_chat_id, monitored_set):
            logger.debug(
                "Message ignored: chat %s not in monitored %s",
                telegram_chat_id,
                monitored_set,
            )
            return

    message_id: UUID | None = None
    async with tenant_session() as session:
        chat = await ensure_chat(session, telegram_chat_id)
        if not chat:
            return
        msg, profile = await store_message(session, chat, tg_message)
        if not msg:
            await session.commit()
            return

        message_id = msg.id
        await session.commit()
        await _broadcast(
            _ws_payload(msg, chat, profile, event_type="message_processing", processing=True)
        )

    task_id = None
    task_payload = None
    try:
        async with tenant_session() as session:
            result = await process_message(session, message_id)
            if isinstance(result, Task):
                task_id = str(result.id)
                task_payload = await load_task_for_broadcast(session, result.id)
            await session.commit()
    except Exception as exc:
        logger.exception("Pipeline failed for message %s", message_id)
        await _mark_classification_error(message_id, str(exc))

    async with tenant_session() as session:
        msg = await session.get(Message, message_id)
        chat = await session.get(Chat, msg.chat_id) if msg else None
        profile = None
        if msg and msg.user_id:
            profile = await session.get(TelegramProfile, msg.user_id)
        if not msg or not chat:
            return

        event_type = "new_task" if task_id else "new_message"
        payload = _ws_payload(
            msg,
            chat,
            profile,
            event_type=event_type,
            task_id=task_id,
            task_payload=task_payload,
            processing=False,
        )
        logger.info(
            "Ingested message %s from chat %s, task=%s",
            msg.id,
            telegram_chat_id,
            task_id,
        )
        await _broadcast(payload)


async def backfill_history(limit: int = 100):
    monitored = await get_monitored_chat_ids()
    if not monitored:
        raise ValueError("No monitored chats configured")

    client = await telegram_auth.get_client()
    async with tenant_session() as session:
        for telegram_chat_id in monitored:
            chat = await ensure_chat(session, telegram_chat_id)
            if not chat:
                continue
            async for tg_message in client.iter_messages(telegram_chat_id, limit=limit):
                msg, _profile = await store_message(session, chat, tg_message)
                if msg:
                    await process_message(session, msg.id)
        await session.commit()
    logger.info("Backfill complete for %s chats, limit=%s", len(monitored), limit)
