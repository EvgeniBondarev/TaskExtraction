"""Telegram Bot API updates, including Connected Business Bot messages."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import os
from pathlib import Path
from typing import Any
import hashlib
import hmac

import httpx

from app.config import get_settings


@dataclass(slots=True)
class BotMessage:
    id: int
    chat_id: int
    text: str | None
    date: datetime
    sender_id: int | None
    sender_name: str | None
    chat_title: str | None
    chat_type: str | None
    reply_to_id: int | None
    raw: dict[str, Any]


def pairing_payload(tenant_key: str, mode: str) -> str:
    secret = get_settings().encryption_key.encode("utf-8")
    value = f"te_{mode}_{tenant_key}"
    signature = hmac.new(secret, value.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
    return f"{value}_{signature}"


def tenant_from_pairing_payload(text: str | None) -> tuple[str, str] | None:
    if not text:
        return None
    command = text.split(maxsplit=1)[0]
    if command.startswith("/start@"):
        command = "/start"
    if not command.startswith("/start"):
        return None
    parts = text.split(maxsplit=1)
    if len(parts) != 2:
        return None
    tokens = parts[1].split("_")
    if len(tokens) != 4 or tokens[0] != "te" or tokens[1] not in {"group", "business"}:
        return None
    _prefix, mode, tenant, signature = tokens
    value = f"te_{mode}_{tenant}"
    expected = hmac.new(get_settings().encryption_key.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
    if not hmac.compare_digest(signature, expected):
        return None
    return tenant, mode


def message_from_update(update: dict[str, Any]) -> BotMessage | None:
    """Normalize ordinary group and Connected Business Bot updates."""
    kind = "business_message" if isinstance(update.get("business_message"), dict) else "message"
    payload = update.get(kind)
    if not isinstance(payload, dict):
        return None
    chat = payload.get("chat") or {}
    if not isinstance(chat, dict) or not isinstance(chat.get("id"), int):
        return None
    # A regular bot is only a source when added to a group. Direct messages are
    # deliberately not collected. Business messages are emitted by Telegram
    # only for chats approved in the Business connection.
    if (
        kind == "message"
        and chat.get("type") not in {"group", "supergroup"}
        and not str(payload.get("text") or "").startswith("/start ")
    ):
        return None
    sender = payload.get("from") or {}
    reply = payload.get("reply_to_message") or {}
    date = datetime.fromtimestamp(int(payload.get("date", 0) or 0), tz=timezone.utc)
    if date.year < 2020:
        date = datetime.now(timezone.utc)
    name = " ".join(filter(None, [sender.get("first_name"), sender.get("last_name")])).strip()
    return BotMessage(
        id=int(payload["message_id"]),
        chat_id=int(chat["id"]),
        text=payload.get("text") or payload.get("caption"),
        date=date,
        sender_id=sender.get("id") if isinstance(sender.get("id"), int) else None,
        sender_name=name or sender.get("username"),
        chat_title=chat.get("title") or name or chat.get("username"),
        chat_type=chat.get("type"),
        reply_to_id=reply.get("message_id") if isinstance(reply.get("message_id"), int) else None,
        raw={
            "source": "telegram_business" if kind == "business_message" else "telegram_bot",
            "business_connection_id": payload.get("business_connection_id"),
            "update_id": update.get("update_id"),
        },
    )


async def send_message(
    chat_id: int,
    text: str,
    reply_to_message_id: int | None = None,
    business_connection_id: str | None = None,
    parse_mode: str | None = None,
    reply_markup: dict[str, Any] | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise ValueError("TELEGRAM_BOT_TOKEN is not configured")
    payload: dict[str, Any] = {"chat_id": chat_id, "text": text, "link_preview_options": {"is_disabled": False}}
    if reply_to_message_id:
        payload["reply_parameters"] = {"message_id": reply_to_message_id}
    if business_connection_id:
        payload["business_connection_id"] = business_connection_id
    if parse_mode:
        payload["parse_mode"] = parse_mode
    if reply_markup:
        payload["reply_markup"] = reply_markup
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(url, json=payload)
    data = response.json()
    if not response.is_success or not data.get("ok"):
        raise ValueError(data.get("description") or "Telegram Bot API sendMessage failed")
    return data["result"]


async def cache_group_avatar(chat_id: int) -> str | None:
    """Download a group's small Telegram photo into local application storage."""
    settings = get_settings()
    if not settings.telegram_bot_token:
        return None
    api_url = f"https://api.telegram.org/bot{settings.telegram_bot_token}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            chat_response = await client.post(f"{api_url}/getChat", json={"chat_id": chat_id})
            chat_data = chat_response.json()
            photo = (chat_data.get("result") or {}).get("photo") if chat_response.is_success else None
            file_id = photo.get("small_file_id") if isinstance(photo, dict) else None
            if not file_id:
                return None
            file_response = await client.post(f"{api_url}/getFile", json={"file_id": file_id})
            file_data = file_response.json()
            file_path = (file_data.get("result") or {}).get("file_path") if file_response.is_success else None
            if not file_path:
                return None
            image_response = await client.get(
                f"https://api.telegram.org/file/bot{settings.telegram_bot_token}/{file_path}"
            )
            if not image_response.is_success:
                return None
    except (httpx.HTTPError, ValueError):
        return None

    media_dir = Path(os.environ.get("DATA_DIR", "/app/data")) / "source-media"
    media_dir.mkdir(parents=True, exist_ok=True)
    target = media_dir / f"telegram-group-{chat_id}.jpg"
    target.write_bytes(image_response.content)
    return str(target)


async def cache_business_user_avatar(user_id: int) -> str | None:
    """Download a profile photo available to a connected Business bot."""
    settings = get_settings()
    if not settings.telegram_bot_token or not user_id:
        return None
    api_url = f"https://api.telegram.org/bot{settings.telegram_bot_token}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            photos_response = await client.post(
                f"{api_url}/getUserProfilePhotos", json={"user_id": user_id, "limit": 1}
            )
            photos_data = photos_response.json()
            photos = (photos_data.get("result") or {}).get("photos") if photos_response.is_success else None
            sizes = photos[0] if isinstance(photos, list) and photos else None
            largest = sizes[-1] if isinstance(sizes, list) and sizes else None
            file_id = largest.get("file_id") if isinstance(largest, dict) else None
            if not file_id:
                return None
            file_response = await client.post(f"{api_url}/getFile", json={"file_id": file_id})
            file_data = file_response.json()
            file_path = (file_data.get("result") or {}).get("file_path") if file_response.is_success else None
            if not file_path:
                return None
            image_response = await client.get(
                f"https://api.telegram.org/file/bot{settings.telegram_bot_token}/{file_path}"
            )
            if not image_response.is_success:
                return None
    except (httpx.HTTPError, ValueError):
        return None

    from app.tenancy.media import effective_media_dir

    avatars_dir = Path(effective_media_dir()) / "avatars" / "users"
    avatars_dir.mkdir(parents=True, exist_ok=True)
    target = avatars_dir / f"{user_id}.jpg"
    target.write_bytes(image_response.content)
    return str(target)
