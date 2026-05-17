"""Push tasks to Jira with description, links and file attachments."""

from __future__ import annotations

import logging
import os
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.entities import ExternalLink, Message, MessageAttachment, Task, TaskComment
from app.services.jira_client import JiraClient, JiraCredentials
from app.services.jira_settings import get_jira_config_row, get_jira_credentials
from app.utils.jira_adf import build_description_adf
from app.utils.task_attachments import collect_task_attachments
from app.utils.telegram_attachments import attachment_abs_path
from app.utils.telegram_link import build_telegram_message_link

logger = logging.getLogger(__name__)

_TASK_LOAD = (
    selectinload(Task.source_message).selectinload(Message.chat),
    selectinload(Task.source_message).selectinload(Message.attachments),
    selectinload(Task.comments).selectinload(TaskComment.message).selectinload(Message.attachments),
    selectinload(Task.external_links),
)


def _iter_attachment_rows(task: Task) -> list[MessageAttachment]:
    seen: set = set()
    rows: list[MessageAttachment] = []

    def add_from_message(message: Message | None) -> None:
        if not message:
            return
        for att in message.attachments or []:
            if att.id in seen:
                continue
            seen.add(att.id)
            rows.append(att)

    add_from_message(task.source_message)
    for comment in task.comments or []:
        add_from_message(comment.message)
    return rows


async def load_task_for_jira(session: AsyncSession, task_id: UUID) -> Task | None:
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD)
    )
    return result.scalar_one_or_none()


def _jira_issue_url(base_url: str, issue_key: str) -> str:
    return f"{base_url.rstrip('/')}/browse/{issue_key}"


async def push_task_to_jira(session: AsyncSession, task: Task) -> ExternalLink | None:
    row = await get_jira_config_row()
    creds_tuple = await get_jira_credentials()
    if not row or not creds_tuple or not row.enabled:
        raise ValueError("Jira не настроен или отключён")

    if not row.project_key or not row.issue_type_id:
        raise ValueError("Выберите проект и тип задачи в настройках Jira")

    for link in task.external_links or []:
        if link.provider == "jira":
            return link

    base_url, email, token = creds_tuple
    client = JiraClient(JiraCredentials(base_url=base_url, email=email, api_token=token))

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
            attachment_lines.append(f"Ссылка: {att.url}")
        elif att.download_url:
            if public_base:
                public_urls.append((label, f"{public_base}{att.download_url}"))
            attachment_lines.append(label)

    description_adf = build_description_adf(
        description=task.description,
        task_type=task.type,
        priority=task.priority,
        confidence=task.confidence,
        telegram_link=telegram_link if row.include_message_links else None,
        sender_name=msg.user_display_name if msg else None,
        chat_title=chat.title if chat else None,
        message_text=msg.text if msg else None,
        attachment_lines=attachment_lines,
        public_attachment_urls=public_urls if row.include_message_links else [],
    )

    created = await client.create_issue(
        project_key=row.project_key,
        issue_type_id=row.issue_type_id,
        summary=task.title,
        description_adf=description_adf,
        priority=task.priority,
    )

    issue_key = created.get("key", "")
    issue_id = str(created.get("id", issue_key))
    if not issue_key:
        raise ValueError("Jira не вернул ключ задачи")

    if row.include_media:
        for att_row in _iter_attachment_rows(task):
            if not att_row.stored_path or att_row.kind == "link":
                continue
            path = attachment_abs_path(settings.media_dir, att_row.stored_path)
            if path and os.path.isfile(path):
                try:
                    await client.add_attachment(
                        issue_key,
                        path,
                        att_row.file_name or os.path.basename(path),
                    )
                except Exception:
                    logger.exception("Jira attachment upload failed for %s", att_row.id)

    ext = ExternalLink(
        task_id=task.id,
        provider="jira",
        external_id=issue_id,
        url=_jira_issue_url(client.base_url, issue_key),
    )
    session.add(ext)
    await session.flush()
    logger.info("Pushed task %s to Jira as %s", task.id, issue_key)
    return ext


async def auto_push_if_enabled(session: AsyncSession, task_id: UUID) -> ExternalLink | None:
    row = await get_jira_config_row()
    if not row or not row.enabled or not row.auto_push:
        return None
    task = await load_task_for_jira(session, task_id)
    if not task:
        return None
    try:
        return await push_task_to_jira(session, task)
    except Exception:
        logger.exception("Jira auto-push failed for task %s", task_id)
        return None
