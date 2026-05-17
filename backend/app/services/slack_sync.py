"""Push tasks to Slack channel."""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.entities import ExternalLink, Message, Task, TaskComment
from app.services.slack_client import SlackClient
from app.services.slack_settings import get_slack_config_row, get_slack_token
from app.utils.slack_message import build_slack_blocks, build_slack_text
from app.utils.task_attachments import collect_task_attachments
from app.utils.telegram_link import build_telegram_message_link

logger = logging.getLogger(__name__)

_TASK_LOAD = (
    selectinload(Task.source_message).selectinload(Message.chat),
    selectinload(Task.source_message).selectinload(Message.attachments),
    selectinload(Task.comments).selectinload(TaskComment.message).selectinload(Message.attachments),
    selectinload(Task.external_links),
)


async def load_task_for_slack(session: AsyncSession, task_id: UUID) -> Task | None:
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD)
    )
    return result.scalar_one_or_none()


async def push_task_to_slack(session: AsyncSession, task: Task) -> ExternalLink | None:
    row = await get_slack_config_row()
    token = await get_slack_token()
    if not row or not token or not row.enabled:
        raise ValueError("Slack не настроен или отключён")

    if not row.channel_id:
        raise ValueError("Выберите канал Slack в настройках")

    for link in task.external_links or []:
        if link.provider == "slack":
            return link

    client = SlackClient(token)
    msg = task.source_message
    chat = msg.chat if msg else None
    telegram_link = None
    if msg and chat:
        telegram_link = build_telegram_message_link(
            chat.telegram_chat_id, msg.telegram_message_id
        )

    attachment_outs = collect_task_attachments(task)
    attachment_lines: list[str] = []
    public_urls: list[tuple[str, str]] = []
    settings = get_settings()
    public_base = (settings.public_api_url or "").rstrip("/")

    for att in attachment_outs:
        label = att.file_name or att.label or att.kind
        if att.url and att.kind == "link":
            attachment_lines.append(att.url)
        elif att.download_url and public_base and row.include_media:
            public_urls.append((label, f"{public_base}{att.download_url}"))
        elif att.download_url:
            attachment_lines.append(label)

    text = build_slack_text(
        title=task.title,
        description=task.description,
        task_type=task.type,
        priority=task.priority,
        confidence=task.confidence,
        telegram_link=telegram_link if row.include_message_links else None,
        sender_name=msg.user_display_name if msg else None,
        chat_title=chat.title if chat else None,
        message_text=msg.text if msg else None,
        attachment_lines=attachment_lines,
        public_urls=public_urls,
    )

    if row.mention_channel:
        text = f"<!channel>\n{text}"

    blocks = build_slack_blocks(text, task.title)
    result = await client.post_message(
        channel=row.channel_id,
        text=task.title,
        blocks=blocks,
    )

    channel = result.get("channel", row.channel_id)
    ts = result.get("ts", "")
    if not ts:
        raise ValueError("Slack не вернул timestamp сообщения")

    permalink = await client.get_permalink(channel, ts)
    if not permalink and row.workspace_url:
        ts_compact = ts.replace(".", "")
        permalink = f"{row.workspace_url.rstrip('/')}/archives/{channel}/p{ts_compact}"

    ext = ExternalLink(
        task_id=task.id,
        provider="slack",
        external_id=f"{channel}:{ts}",
        url=permalink or f"https://slack.com/app_redirect?channel={channel}",
    )
    session.add(ext)
    await session.flush()
    logger.info("Pushed task %s to Slack %s", task.id, ts)
    return ext


async def auto_push_if_enabled(session: AsyncSession, task_id: UUID) -> ExternalLink | None:
    row = await get_slack_config_row()
    if not row or not row.enabled or not row.auto_push:
        return None
    task = await load_task_for_slack(session, task_id)
    if not task:
        return None
    try:
        return await push_task_to_slack(session, task)
    except Exception:
        logger.exception("Slack auto-push failed for task %s", task_id)
        return None
