"""Резолв peer для send_message — Telethon требует entity в кэше (access_hash)."""

from __future__ import annotations

import logging
from typing import Any

from telethon import TelegramClient
from telethon.errors import RPCError
from telethon.tl.types import Channel, Chat as TgChat, User

from app.models.entities import Chat, Message
from app.utils.telegram_ids import normalize_telegram_chat_id

logger = logging.getLogger(__name__)


def _classify_entity(entity: Any) -> str:
    if isinstance(entity, User):
        return "private"
    if isinstance(entity, TgChat):
        return "group"
    if isinstance(entity, Channel):
        return "supergroup" if getattr(entity, "megagroup", False) else "channel"
    return "unknown"


async def _try_input_entity(client: TelegramClient, key: str | int) -> Any | None:
    try:
        return await client.get_input_entity(key)
    except (ValueError, TypeError, RPCError) as exc:
        logger.debug("get_input_entity(%s): %s", key, exc)
        return None


async def resolve_chat_input_entity(
    client: TelegramClient,
    chat: Chat,
    source_message: Message | None = None,
) -> Any:
    """
    Input peer для send_message. Для личных чатов без кэша — поиск в dialogs.
    """
    telegram_chat_id = normalize_telegram_chat_id(chat.telegram_chat_id)
    username = (chat.username or "").strip().lstrip("@") or None
    source_user_id = source_message.user_id if source_message else None

    if username:
        peer = await _try_input_entity(client, username)
        if peer is not None:
            return peer

    peer = await _try_input_entity(client, telegram_chat_id)
    if peer is not None:
        return peer

    # Личка: chat_id часто совпадает с user_id отправителя
    is_private = chat.chat_type == "private" or (telegram_chat_id > 0 and chat.chat_type in (None, "unknown"))
    if is_private and source_user_id:
        peer = await _try_input_entity(client, int(source_user_id))
        if peer is not None:
            return peer

    # Диалоги подгружают access_hash в сессию Telethon
    async for dialog in client.iter_dialogs():
        did = normalize_telegram_chat_id(dialog.id)
        if did != telegram_chat_id:
            continue
        ent = dialog.entity
        if chat.chat_type in (None, "unknown") and ent is not None:
            chat.chat_type = _classify_entity(ent)
            un = getattr(ent, "username", None)
            if un and not chat.username:
                chat.username = un
        return dialog.input_entity

    raise ValueError(
        f"Could not find the input entity for chat {telegram_chat_id}. "
        "Откройте этот чат в Telegram или обновите список чатов в настройках панели."
    )
