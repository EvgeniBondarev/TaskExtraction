import logging
import os
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from telethon.tl.types import Channel, Chat as TgChat, User
from telethon.utils import get_peer_id

from app.config import get_settings
from app.database import async_session_factory
from app.models.entities import Chat
from app.services import telegram_auth
from app.utils.telegram_ids import normalize_telegram_chat_id

logger = logging.getLogger(__name__)


def _classify_entity(entity) -> str:
    if isinstance(entity, User):
        return "private"
    if isinstance(entity, TgChat):
        return "group"
    if isinstance(entity, Channel):
        if getattr(entity, "megagroup", False):
            return "supergroup"
        return "channel"
    return "unknown"


def _dialog_title(dialog) -> str:
    name = getattr(dialog, "name", None) or getattr(dialog, "title", None)
    if name:
        return str(name)[:255]
    entity = dialog.entity
    if isinstance(entity, User):
        parts = [entity.first_name or "", entity.last_name or ""]
        return " ".join(p for p in parts if p).strip() or (entity.username or "User")
    return "Chat"


async def _download_avatar(client, entity, telegram_chat_id: int) -> str | None:
    settings = get_settings()
    avatars_dir = os.path.join(settings.media_dir, "avatars")
    os.makedirs(avatars_dir, exist_ok=True)
    dest = os.path.join(avatars_dir, f"{telegram_chat_id}.jpg")
    try:
        path = await client.download_profile_photo(entity, file=dest)
        return path or (dest if os.path.isfile(dest) else None)
    except Exception as e:
        logger.debug("Avatar download skipped for %s: %s", telegram_chat_id, e)
        return None


async def _migrate_legacy_monitor(session: AsyncSession) -> None:
    row = await telegram_auth.get_config_row()
    if not row or not row.monitor_chat_id:
        return
    legacy_id = row.monitor_chat_id
    result = await session.execute(select(Chat).where(Chat.telegram_chat_id == legacy_id))
    chat = result.scalar_one_or_none()
    if chat:
        if not chat.is_monitored:
            chat.is_monitored = True
    else:
        session.add(
            Chat(
                telegram_chat_id=legacy_id,
                title="Legacy monitor",
                is_monitored=True,
                chat_type="unknown",
            )
        )


async def sync_dialogs(limit: int = 300) -> list[Chat]:
    status = await telegram_auth.get_status()
    if not status.is_authorized:
        raise ValueError("Telegram not authorized")

    client = await telegram_auth.get_client()
    synced: list[Chat] = []

    async with async_session_factory() as session:
        await _migrate_legacy_monitor(session)
        await session.commit()

    async with async_session_factory() as session:
        existing = {
            c.telegram_chat_id: c
            for c in (await session.execute(select(Chat))).scalars().all()
        }

        count = 0
        async for dialog in client.iter_dialogs(limit=limit):
            if dialog.is_user and getattr(dialog.entity, "bot", False):
                continue

            entity = dialog.entity
            try:
                telegram_chat_id = get_peer_id(dialog.id)
            except Exception:
                telegram_chat_id = dialog.id

            title = _dialog_title(dialog)
            chat_type = _classify_entity(entity)
            username = getattr(entity, "username", None)

            parent_id = None
            if isinstance(entity, Channel) and getattr(entity, "forum", False):
                parent_id = None

            row = existing.get(telegram_chat_id)
            if row:
                row.title = title
                row.chat_type = chat_type
                row.username = username
                row.updated_at = datetime.now(timezone.utc)
                chat = row
            else:
                chat = Chat(
                    telegram_chat_id=telegram_chat_id,
                    title=title,
                    chat_type=chat_type,
                    username=username,
                    parent_telegram_chat_id=parent_id,
                    is_monitored=False,
                )
                session.add(chat)
                existing[telegram_chat_id] = chat

            if not chat.photo_path or not os.path.isfile(chat.photo_path):
                photo = await _download_avatar(client, entity, telegram_chat_id)
                if photo:
                    chat.photo_path = photo

            synced.append(chat)
            count += 1

        await session.commit()
        for chat in synced:
            await session.refresh(chat)

    logger.info("Synced %s dialogs from Telegram", count)
    return synced


async def get_monitored_telegram_ids() -> list[int]:
    async with async_session_factory() as session:
        result = await session.execute(
            select(Chat.telegram_chat_id).where(Chat.is_monitored.is_(True))
        )
        return list(result.scalars().all())


async def get_chat_status() -> dict:
    async with async_session_factory() as session:
        total = await session.scalar(select(func.count()).select_from(Chat)) or 0
        monitored = (
            await session.scalar(
                select(func.count()).select_from(Chat).where(Chat.is_monitored.is_(True))
            )
            or 0
        )
    return {
        "monitored_count": monitored,
        "total_count": total,
        "has_monitored": monitored > 0,
    }


async def set_monitored_chats(telegram_chat_ids: list[int]) -> list[Chat]:
    ids_set = {normalize_telegram_chat_id(i) for i in telegram_chat_ids}
    async with async_session_factory() as session:
        await session.execute(update(Chat).values(is_monitored=False))
        if ids_set:
            result = await session.execute(
                select(Chat).where(Chat.telegram_chat_id.in_(ids_set))
            )
            found = {c.telegram_chat_id: c for c in result.scalars().all()}
            missing = ids_set - set(found.keys())
            for tid in missing:
                session.add(
                    Chat(
                        telegram_chat_id=tid,
                        title=f"Chat {tid}",
                        is_monitored=True,
                        chat_type="unknown",
                    )
                )
            for chat in found.values():
                chat.is_monitored = True
        await session.commit()
        result = await session.execute(
            select(Chat).where(Chat.is_monitored.is_(True)).order_by(Chat.title)
        )
        return list(result.scalars().all())


async def list_chats(monitored_only: bool = False) -> tuple[list[Chat], int, int]:
    async with async_session_factory() as session:
        q = select(Chat).order_by(Chat.title.nulls_last(), Chat.created_at.desc())
        if monitored_only:
            q = q.where(Chat.is_monitored.is_(True))
        chats = list((await session.execute(q)).scalars().all())
        monitored = (
            await session.scalar(
                select(func.count()).select_from(Chat).where(Chat.is_monitored.is_(True))
            )
            or 0
        )
    return chats, len(chats), monitored


async def get_chat_by_id(chat_uuid) -> Chat | None:
    async with async_session_factory() as session:
        result = await session.execute(select(Chat).where(Chat.id == chat_uuid))
        return result.scalar_one_or_none()
