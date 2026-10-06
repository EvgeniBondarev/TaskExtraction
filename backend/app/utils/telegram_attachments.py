"""Download Telegram message media and extract links for task attachments."""

from __future__ import annotations

import logging
import mimetypes
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import httpx

from telethon.tl.types import (
    DocumentAttributeAnimated,
    DocumentAttributeAudio,
    DocumentAttributeFilename,
    DocumentAttributeImageSize,
    DocumentAttributeVideo,
    MessageEntityTextUrl,
    MessageEntityUrl,
    MessageMediaDocument,
    MessageMediaPhoto,
    MessageMediaWebPage,
)

logger = logging.getLogger(__name__)

URL_RE = re.compile(r"https?://[^\s<>\"{}|\\^`\[\]]+", re.IGNORECASE)

IMAGE_MIMES = frozenset(
    {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"}
)
VIDEO_MIMES = frozenset({"video/mp4", "video/webm", "video/quicktime", "video/x-matroska"})
AUDIO_MIMES = frozenset({"audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/mp4"})

EXT_BY_KIND = {
    "photo": ".jpg",
    "video": ".mp4",
    "voice": ".ogg",
    "audio": ".mp3",
    "sticker": ".webp",
    "animation": ".mp4",
}


@dataclass
class PreparedAttachment:
    kind: str
    file_name: str | None = None
    stored_path: str | None = None
    mime_type: str | None = None
    file_size: int | None = None
    url: str | None = None
    meta: dict = field(default_factory=dict)


def _safe_filename(name: str, max_len: int = 180) -> str:
    name = re.sub(r"[^\w.\- ()\[\]]+", "_", name.strip()) or "file"
    if len(name) > max_len:
        base, dot, ext = name.rpartition(".")
        if dot:
            name = base[: max_len - len(ext) - 1] + "." + ext
        else:
            name = name[:max_len]
    return name


def _mime_from_name(filename: str) -> str | None:
    guessed, _ = mimetypes.guess_type(filename)
    return guessed


def _document_attrs(document) -> dict:
    out: dict = {}
    if getattr(document, "mime_type", None):
        out["mime_type"] = document.mime_type
    for attr in document.attributes or []:
        if isinstance(attr, DocumentAttributeFilename):
            out["file_name"] = attr.file_name
        elif isinstance(attr, DocumentAttributeImageSize):
            out["width"] = attr.w
            out["height"] = attr.h
        elif isinstance(attr, DocumentAttributeVideo):
            out["duration"] = attr.duration
            out["width"] = getattr(attr, "w", None)
            out["height"] = getattr(attr, "h", None)
        elif isinstance(attr, DocumentAttributeAudio):
            out["duration"] = attr.duration
            out["voice"] = bool(attr.voice)
        elif isinstance(attr, DocumentAttributeAnimated):
            out["animated"] = True
    return out


def _classify_document(document, attrs: dict) -> str:
    mime = (attrs.get("mime_type") or "").lower()
    name = (attrs.get("file_name") or "").lower()
    if attrs.get("voice"):
        return "voice"
    if "sticker" in mime or name.endswith(".webp") and attrs.get("animated"):
        return "sticker"
    if attrs.get("animated") or mime == "video/mp4" and "gif" in name:
        return "animation"
    if mime.startswith("video/") or attrs.get("duration") and "width" in attrs:
        return "video"
    if mime.startswith("audio/"):
        return "audio"
    if mime in IMAGE_MIMES or name.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
        return "photo"
    if name.endswith(".pdf"):
        return "pdf"
    if name.endswith((".xls", ".xlsx", ".csv")):
        return "spreadsheet"
    if name.endswith((".doc", ".docx", ".rtf", ".txt", ".md")):
        return "document"
    if name.endswith((".zip", ".rar", ".7z", ".tar", ".gz")):
        return "archive"
    return "file"


def extract_urls_from_message(tg_message) -> list[str]:
    text = tg_message.message or tg_message.text or ""
    urls: list[str] = []
    seen: set[str] = set()

    for entity in tg_message.entities or []:
        if isinstance(entity, MessageEntityUrl):
            chunk = text[entity.offset : entity.offset + entity.length]
            if chunk and chunk not in seen:
                seen.add(chunk)
                urls.append(chunk)
        elif isinstance(entity, MessageEntityTextUrl):
            if entity.url and entity.url not in seen:
                seen.add(entity.url)
                urls.append(entity.url)

    for match in URL_RE.findall(text):
        url = match.rstrip(".,;:!?)")
        if url not in seen:
            seen.add(url)
            urls.append(url)

    return urls


def extract_urls_from_bot_message(payload: dict) -> list[str]:
    """Extract URLs from a Bot API message or caption without duplicating them."""
    text = str(payload.get("text") or payload.get("caption") or "")
    urls: list[str] = []
    seen: set[str] = set()

    for entity in payload.get("entities") or payload.get("caption_entities") or []:
        if not isinstance(entity, dict):
            continue
        if entity.get("type") == "text_link" and isinstance(entity.get("url"), str):
            url = entity["url"]
        elif entity.get("type") == "url":
            offset, length = entity.get("offset"), entity.get("length")
            url = text[offset : offset + length] if isinstance(offset, int) and isinstance(length, int) else ""
        else:
            continue
        if url and url not in seen:
            seen.add(url)
            urls.append(url)

    for match in URL_RE.findall(text):
        url = match.rstrip(".,;:!?)")
        if url not in seen:
            seen.add(url)
            urls.append(url)
    return urls


def _bot_document_kind(item: dict, fallback: str = "file") -> str:
    mime = str(item.get("mime_type") or "").lower()
    name = str(item.get("file_name") or "").lower()
    if item.get("is_video") or mime.startswith("video/"):
        return "video"
    if mime.startswith("audio/"):
        return "audio"
    if mime in IMAGE_MIMES or name.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
        return "photo"
    if name.endswith(".pdf"):
        return "pdf"
    if name.endswith((".xls", ".xlsx", ".csv")):
        return "spreadsheet"
    if name.endswith((".doc", ".docx", ".rtf", ".txt", ".md")):
        return "document"
    if name.endswith((".zip", ".rar", ".7z", ".tar", ".gz")):
        return "archive"
    return fallback


def _bot_media_info(payload: dict) -> tuple[str, dict, str, str | None] | None:
    """Return kind, Bot API media object, default filename and MIME type."""
    message_id = payload.get("message_id")
    suffix = str(message_id) if isinstance(message_id, int) else "file"
    photos = payload.get("photo")
    if isinstance(photos, list) and photos and isinstance(photos[-1], dict):
        return "photo", photos[-1], f"photo_{suffix}.jpg", "image/jpeg"
    for field, kind, ext, mime in (
        ("animation", "animation", ".mp4", "video/mp4"),
        ("video", "video", ".mp4", "video/mp4"),
        ("video_note", "video", ".mp4", "video/mp4"),
        ("voice", "voice", ".ogg", "audio/ogg"),
        ("audio", "audio", ".mp3", "audio/mpeg"),
        ("sticker", "sticker", ".webp", "image/webp"),
    ):
        item = payload.get(field)
        if isinstance(item, dict):
            return kind, item, f"{kind}_{suffix}{ext}", str(item.get("mime_type") or mime)
    document = payload.get("document")
    if isinstance(document, dict):
        kind = _bot_document_kind(document)
        name = str(document.get("file_name") or f"{kind}_{suffix}")
        return kind, document, name, str(document.get("mime_type") or _mime_from_name(name) or "") or None
    return None


async def download_bot_api_attachments(payload: dict, media_dir: str) -> list[PreparedAttachment]:
    """Download every file that a Telegram Bot API message can carry.

    The normal Telethon path already persists attachments. This parallel path is
    for messages delivered directly to the project bot (groups and Business),
    where no user Telegram session is available to download the media.
    """
    results: list[PreparedAttachment] = []
    media = _bot_media_info(payload)
    if media:
        kind, item, fallback_name, mime_type = media
        file_id = item.get("file_id") if isinstance(item, dict) else None
        chat = payload.get("chat") or {}
        chat_id = chat.get("id") if isinstance(chat, dict) else None
        message_id = payload.get("message_id")
        from app.config import get_settings

        token = get_settings().telegram_bot_token
        if isinstance(file_id, str) and token and isinstance(chat_id, int) and isinstance(message_id, int):
            try:
                api_url = f"https://api.telegram.org/bot{token}"
                async with httpx.AsyncClient(timeout=30) as client:
                    file_response = await client.post(f"{api_url}/getFile", json={"file_id": file_id})
                    file_data = file_response.json()
                    file_path = (file_data.get("result") or {}).get("file_path") if file_response.is_success else None
                    if not file_path:
                        raise ValueError("Telegram did not return a file path")
                    download_response = await client.get(f"https://api.telegram.org/file/bot{token}/{file_path}")
                    download_response.raise_for_status()
                dest_dir = Path(media_dir) / "messages" / str(chat_id) / str(message_id)
                dest_dir.mkdir(parents=True, exist_ok=True)
                filename = _safe_filename(str(item.get("file_name") or fallback_name))
                target = dest_dir / filename
                target.write_bytes(download_response.content)
                results.append(
                    PreparedAttachment(
                        kind=kind,
                        file_name=filename,
                        stored_path=target.relative_to(Path(media_dir)).as_posix(),
                        mime_type=mime_type,
                        file_size=target.stat().st_size,
                        meta={"telegram_file_id": file_id},
                    )
                )
            except (httpx.HTTPError, ValueError, OSError):
                logger.exception("Failed to download Bot API media for message %s", message_id)

    for url in extract_urls_from_bot_message(payload):
        results.append(PreparedAttachment(kind="link", url=url, file_name=url))
    return results


def _message_media_kind(tg_message) -> str | None:
    media = tg_message.media
    if not media:
        if tg_message.photo:
            return "photo"
        if tg_message.document:
            return "document"
        if tg_message.video:
            return "video"
        if tg_message.voice:
            return "voice"
        if tg_message.audio:
            return "audio"
        return None
    if isinstance(media, MessageMediaPhoto):
        return "photo"
    if isinstance(media, MessageMediaDocument):
        doc = media.document
        if doc:
            return _classify_document(doc, _document_attrs(doc))
        return "file"
    if isinstance(media, MessageMediaWebPage):
        return "webpage"
    return "file"


async def download_message_attachments(
    client,
    tg_message,
    media_dir: str,
) -> list[PreparedAttachment]:
    """Download files and collect link attachments for one Telegram message."""
    results: list[PreparedAttachment] = []
    chat_id = tg_message.chat_id
    msg_id = tg_message.id
    dest_dir = Path(media_dir) / "messages" / str(chat_id) / str(msg_id)
    dest_dir.mkdir(parents=True, exist_ok=True)

    media_kind = _message_media_kind(tg_message)
    if media_kind and media_kind not in ("webpage",):
        try:
            attrs: dict = {}
            file_name: str | None = None
            mime_type: str | None = None

            if tg_message.document:
                attrs = _document_attrs(tg_message.document)
                file_name = attrs.get("file_name")
                mime_type = attrs.get("mime_type")
                media_kind = _classify_document(tg_message.document, attrs)
            elif tg_message.photo:
                media_kind = "photo"
                mime_type = "image/jpeg"
                file_name = f"photo_{msg_id}.jpg"
            elif tg_message.video:
                media_kind = "video"
                mime_type = "video/mp4"
                file_name = f"video_{msg_id}.mp4"
            elif tg_message.voice:
                media_kind = "voice"
                mime_type = "audio/ogg"
                file_name = f"voice_{msg_id}.ogg"
            elif tg_message.audio:
                media_kind = "audio"
                file_name = f"audio_{msg_id}.mp3"

            ext = EXT_BY_KIND.get(media_kind) or (
                mimetypes.guess_extension(mime_type or "") if mime_type else ""
            )
            if not file_name:
                file_name = f"{media_kind}_{msg_id}{ext or ''}"
            elif ext and not file_name.lower().endswith(ext.lower()):
                if "." not in file_name:
                    file_name = file_name + ext

            file_name = _safe_filename(file_name)
            dest_file = dest_dir / file_name

            downloaded = await client.download_media(tg_message, file=str(dest_file))
            if downloaded:
                path = Path(downloaded)
                if not mime_type:
                    mime_type = _mime_from_name(path.name)
                rel_path = path.relative_to(Path(media_dir)).as_posix()
                results.append(
                    PreparedAttachment(
                        kind=media_kind,
                        file_name=path.name,
                        stored_path=rel_path,
                        mime_type=mime_type,
                        file_size=path.stat().st_size if path.is_file() else None,
                        meta={
                            k: v
                            for k, v in attrs.items()
                            if k in ("width", "height", "duration", "voice", "animated")
                        },
                    )
                )
        except Exception:
            logger.exception("Failed to download media for message %s in chat %s", msg_id, chat_id)

    elif isinstance(tg_message.media, MessageMediaWebPage) and tg_message.media.webpage:
        wp = tg_message.media.webpage
        page_url = getattr(wp, "url", None) or getattr(wp, "display_url", None)
        if page_url:
            title = getattr(wp, "title", None) or getattr(wp, "site_name", None)
            results.append(
                PreparedAttachment(
                    kind="link",
                    url=page_url,
                    file_name=title or page_url,
                    meta={"source": "webpage_preview", "description": getattr(wp, "description", None)},
                )
            )

    for i, url in enumerate(extract_urls_from_message(tg_message)):
        if any(a.url == url for a in results):
            continue
        results.append(
            PreparedAttachment(
                kind="link",
                url=url,
                file_name=url,
            )
        )

    return results


def attachment_abs_path(media_dir: str, stored_path: str | None) -> str | None:
    if not stored_path:
        return None
    if os.path.isabs(stored_path):
        return stored_path if os.path.isfile(stored_path) else None
    full = os.path.join(media_dir, stored_path)
    return full if os.path.isfile(full) else None


def is_previewable_image(mime_type: str | None, kind: str) -> bool:
    if kind == "photo":
        return True
    return bool(mime_type and mime_type.lower() in IMAGE_MIMES)
