import os

from app.models.entities import Chat, Message, TelegramProfile


def chat_avatar_url(chat: Chat | None) -> str | None:
    if not chat or not chat.photo_path or not os.path.isfile(chat.photo_path):
        return None
    return f"/api/chats/{chat.id}/avatar"


def sender_avatar_url(user_id: int | None, profile: TelegramProfile | None) -> str | None:
    if not user_id:
        return None
    if profile and profile.photo_path and os.path.isfile(profile.photo_path):
        return f"/api/profiles/{user_id}/avatar"
    return None
