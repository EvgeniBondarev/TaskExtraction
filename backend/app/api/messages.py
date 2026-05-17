from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_session
from app.models.entities import Message, Task, TelegramProfile
from app.schemas.attachments import attachment_to_out
from app.schemas.messages import MessageList, MessageOut
from app.services.prompt_settings import get_prompt_config
from app.utils.message_classification import build_classification_out
from app.utils.message_media import chat_avatar_url, sender_avatar_url
from app.utils.telegram_link import build_telegram_message_link

router = APIRouter(prefix="/messages", tags=["messages"])


async def _load_profiles(session: AsyncSession, user_ids: set[int]) -> dict[int, TelegramProfile]:
    if not user_ids:
        return {}
    result = await session.execute(
        select(TelegramProfile).where(TelegramProfile.telegram_user_id.in_(user_ids))
    )
    return {p.telegram_user_id: p for p in result.scalars().all()}


async def _enrich(
    msg: Message,
    profile: TelegramProfile | None = None,
    confidence_threshold: float = 0.75,
) -> MessageOut:
    out = MessageOut.model_validate(msg)
    if msg.chat:
        out.chat_title = msg.chat.title
        out.chat_avatar_url = chat_avatar_url(msg.chat)
        out.telegram_link = build_telegram_message_link(
            msg.chat.telegram_chat_id, msg.telegram_message_id
        )
    out.sender_avatar_url = sender_avatar_url(msg.user_id, profile)
    if profile and profile.display_name and not out.user_display_name:
        out.user_display_name = profile.display_name
    out.classification = build_classification_out(msg, confidence_threshold)
    out.attachments = [attachment_to_out(a) for a in (msg.attachments or [])]
    task = getattr(msg, "task", None)
    if task and task.external_links:
        for link in task.external_links:
            if link.provider == "jira":
                out.jira_issue_key = link.external_id
                out.jira_url = link.url
            elif link.provider == "trello":
                out.trello_card_id = link.external_id
                out.trello_url = link.url
            elif link.provider == "github":
                out.github_issue_number = link.external_id
                out.github_url = link.url
            elif link.provider == "slack":
                out.slack_message_id = link.external_id
                out.slack_url = link.url
    return out


@router.get("", response_model=MessageList)
async def list_messages(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    total = await session.scalar(select(func.count()).select_from(Message))
    result = await session.execute(
        select(Message)
        .options(
            selectinload(Message.chat),
            selectinload(Message.task).selectinload(Task.external_links),
            selectinload(Message.attachments),
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    messages = list(result.scalars().all())
    user_ids = {m.user_id for m in messages if m.user_id}
    profiles = await _load_profiles(session, user_ids)
    prompts = await get_prompt_config()
    items = [
        await _enrich(
            m,
            profiles.get(m.user_id) if m.user_id else None,
            prompts.confidence_threshold,
        )
        for m in messages
    ]
    return MessageList(items=items, total=total or 0, limit=limit, offset=offset)


@router.get("/{message_id}", response_model=MessageOut)
async def get_message(
    message_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Message)
        .where(Message.id == message_id)
        .options(
            selectinload(Message.chat),
            selectinload(Message.task).selectinload(Task.external_links),
            selectinload(Message.attachments),
        )
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(404, "Message not found")
    profile = None
    if msg.user_id:
        profiles = await _load_profiles(session, {msg.user_id})
        profile = profiles.get(msg.user_id)
    prompts = await get_prompt_config()
    return await _enrich(msg, profile, prompts.confidence_threshold)
