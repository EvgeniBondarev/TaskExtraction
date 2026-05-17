import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.config import get_settings
from app.models.entities import MessageAttachment
from app.schemas.attachments import AttachmentOut, attachment_to_out
from app.utils.telegram_attachments import attachment_abs_path

router = APIRouter(prefix="/attachments", tags=["attachments"])


@router.get("/{attachment_id}", response_model=AttachmentOut)
async def get_attachment_meta(
    attachment_id: str,
    session: AsyncSession = Depends(get_session),
):
    from uuid import UUID

    result = await session.execute(
        select(MessageAttachment).where(MessageAttachment.id == UUID(attachment_id))
    )
    att = result.scalar_one_or_none()
    if not att:
        raise HTTPException(404, "Attachment not found")
    return attachment_to_out(att)


@router.get("/{attachment_id}/file")
async def download_attachment_file(
    attachment_id: str,
    session: AsyncSession = Depends(get_session),
):
    from uuid import UUID

    result = await session.execute(
        select(MessageAttachment).where(MessageAttachment.id == UUID(attachment_id))
    )
    att = result.scalar_one_or_none()
    if not att or not att.stored_path:
        raise HTTPException(404, "File not found")

    from app.tenancy.media import effective_media_dir

    path = attachment_abs_path(effective_media_dir(), att.stored_path)
    if not path:
        raise HTTPException(404, "File not found on disk")

    media_type = att.mime_type or "application/octet-stream"
    filename = att.file_name or os.path.basename(path)
    inline = media_type.startswith("image/") or media_type.startswith("video/")
    return FileResponse(
        path,
        media_type=media_type,
        filename=filename,
        content_disposition_type="inline" if inline else "attachment",
    )
