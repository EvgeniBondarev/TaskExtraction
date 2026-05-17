"""Download Telegram message media and extract links for task attachments."""

from __future__ import annotations

import logging
import mimetypes
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

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
