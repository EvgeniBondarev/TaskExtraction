import os
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.chats import ChatList, ChatOut, ChatSelectionIn, ChatStatusOut, ChatSyncOut
from app.services import chat_sync
from app.telegram.listener import wake_ingest

router = APIRouter(prefix="/chats", tags=["chats"])


def _to_out(chat) -> ChatOut:
    return ChatOut(
        id=chat.id,
        telegram_chat_id=chat.telegram_chat_id,
        title=chat.title,
        is_monitored=chat.is_monitored,
        chat_type=chat.chat_type,
        username=chat.username,
        parent_telegram_chat_id=chat.parent_telegram_chat_id,
        has_photo=bool(chat.photo_path and os.path.isfile(chat.photo_path)),
        created_at=chat.created_at,
        updated_at=chat.updated_at,
    )


@router.get("/status", response_model=ChatStatusOut)
async def chats_status():
    s = await chat_sync.get_chat_status()
    return ChatStatusOut(**s)


@router.get("", response_model=ChatList)
async def list_chats(monitored_only: bool = False):
    items, total, monitored = await chat_sync.list_chats(monitored_only=monitored_only)
    return ChatList(
        items=[_to_out(c) for c in items],
        total=total,
        monitored_count=monitored,
    )


@router.post("/sync", response_model=ChatSyncOut)
async def sync_chats():
    try:
        synced = await chat_sync.sync_dialogs()
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        raise HTTPException(502, f"Telegram sync failed: {e}") from e
    return ChatSyncOut(synced=len(synced), items=[_to_out(c) for c in synced])


@router.put("/selection", response_model=ChatList)
async def update_selection(body: ChatSelectionIn):
    if not body.telegram_chat_ids:
        raise HTTPException(400, "Select at least one chat")
    selected = await chat_sync.set_monitored_chats(body.telegram_chat_ids)
    wake_ingest()
    return ChatList(
        items=[_to_out(c) for c in selected],
        total=len(selected),
        monitored_count=len(selected),
    )


@router.get("/{chat_id}/avatar")
async def chat_avatar(chat_id: UUID, session: AsyncSession = Depends(get_session)):
    from sqlalchemy import select

    from app.models.entities import Chat

    result = await session.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    if not chat or not chat.photo_path or not os.path.isfile(chat.photo_path):
        raise HTTPException(404, "Avatar not found")
    return FileResponse(chat.photo_path, media_type="image/jpeg")
