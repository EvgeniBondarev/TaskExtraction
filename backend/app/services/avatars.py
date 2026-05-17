import logging
import os
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from telethon.tl.types import Channel, Chat as TgChat, User

from app.config import get_settings
from app.models.entities import Chat, TelegramProfile

logger = logging.getLogger(__name__)


def _avatars_dir() -> str:
    settings = get_settings()
    path = os.path.join(settings.media_dir, "avatars", "users")
    os.makedirs(path, exist_ok=True)
    return path


async def ensure_chat_avatar(session: AsyncSession, client, chat: Chat, telegram_chat_id: int) -> None:
    if chat.photo_path and os.path.isfile(chat.photo_path):
        return
    try:
        entity = await client.get_entity(telegram_chat_id)
        settings = get_settings()
        avatars_dir = os.path.join(settings.media_dir, "avatars")
        os.makedirs(avatars_dir, exist_ok=True)
        dest = os.path.join(avatars_dir, f"{telegram_chat_id}.jpg")
        path = await client.download_profile_photo(entity, file=dest)
        if path and os.path.isfile(path):
            chat.photo_path = path
        elif os.path.isfile(dest):
            chat.photo_path = dest
    except Exception as e:
        logger.debug("Chat avatar %s: %s", telegram_chat_id, e)


async def ensure_user_profile(
    session: AsyncSession, client, user_id: int
) -> TelegramProfile | None:
    if not user_id:
        return None

    result = await session.execute(
        select(TelegramProfile).where(TelegramProfile.telegram_user_id == user_id)
    )
    profile = result.scalar_one_or_none()

    try:
        entity = await client.get_entity(user_id)
    except Exception:
        return profile

    display_name = None
    if isinstance(entity, User):
        display_name = entity.first_name or entity.username
    elif isinstance(entity, (Channel, TgChat)):
        display_name = getattr(entity, "title", None)

    if not profile:
        profile = TelegramProfile(telegram_user_id=user_id, display_name=display_name)
        session.add(profile)
    elif display_name:
        profile.display_name = display_name

    dest = os.path.join(_avatars_dir(), f"{user_id}.jpg")
    if not profile.photo_path or not os.path.isfile(profile.photo_path):
        try:
            path = await client.download_profile_photo(entity, file=dest)
            if path and os.path.isfile(path):
                profile.photo_path = path
            elif os.path.isfile(dest):
                profile.photo_path = dest
        except Exception as e:
            logger.debug("User avatar %s: %s", user_id, e)

    profile.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return profile
