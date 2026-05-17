from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.utils.telegram_attachments import is_previewable_image


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    message_id: UUID
    kind: str
    file_name: str | None
    mime_type: str | None
    file_size: int | None
    url: str | None
    meta: dict | None = None
    sort_order: int = 0
    created_at: datetime
    download_url: str | None = None
    is_image: bool = False
    is_video: bool = False
    is_audio: bool = False
    label: str = ""


def attachment_to_out(att) -> AttachmentOut:
    label = att.file_name or att.url or att.kind
    mime = att.mime_type or ""
    return AttachmentOut(
        id=att.id,
        message_id=att.message_id,
        kind=att.kind,
        file_name=att.file_name,
        mime_type=att.mime_type,
        file_size=att.file_size,
        url=att.url,
        meta=att.meta,
        sort_order=att.sort_order,
        created_at=att.created_at,
        download_url=f"/api/attachments/{att.id}/file" if att.stored_path else None,
        is_image=is_previewable_image(att.mime_type, att.kind),
        is_video=att.kind in ("video", "animation") or mime.startswith("video/"),
        is_audio=att.kind in ("voice", "audio") or mime.startswith("audio/"),
        label=label,
    )
