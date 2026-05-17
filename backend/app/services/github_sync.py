"""Push tasks to GitHub Issues."""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.entities import ExternalLink, Message, Task, TaskComment
from app.services.github_client import GitHubClient, GitHubCredentials
from app.services.github_settings import get_github_config_row, get_github_credentials
from app.utils.github_description import build_issue_body
from app.utils.task_attachments import collect_task_attachments
from app.utils.telegram_link import build_telegram_message_link

logger = logging.getLogger(__name__)

_TASK_LOAD = (
    selectinload(Task.source_message).selectinload(Message.chat),
    selectinload(Task.source_message).selectinload(Message.attachments),
    selectinload(Task.comments).selectinload(TaskComment.message).selectinload(Message.attachments),
    selectinload(Task.external_links),
)

TYPE_LABEL_MAP = {
    "bug": "bug",
    "feature": "enhancement",
    "other": "task",
}

PRIORITY_LABEL_MAP = {
    "high": "urgent",
    "medium": "medium priority",
    "low": "low priority",
}


async def load_task_for_github(session: AsyncSession, task_id: UUID) -> Task | None:
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD)
    )
    return result.scalar_one_or_none()


def _resolve_labels(
    row,
    task: Task,
    available: set[str],
) -> list[str]:
    labels: list[str] = []
    seen: set[str] = set()

    def add(name: str | None) -> None:
        if not name or name in seen:
            return
        if available and name not in available:
            return
        seen.add(name)
        labels.append(name)

    for name in row.default_labels or []:
        add(name)

    if row.use_type_labels:
        add(TYPE_LABEL_MAP.get(task.type, task.type))
        add(PRIORITY_LABEL_MAP.get(task.priority))

    return labels[:10]


async def push_task_to_github(session: AsyncSession, task: Task) -> ExternalLink | None:
    row = await get_github_config_row()
    creds_tuple = await get_github_credentials()
    if not row or not creds_tuple or not row.enabled:
        raise ValueError("GitHub не настроен или отключён")

    for link in task.external_links or []:
        if link.provider == "github":
            return link

    owner, repo, token = creds_tuple
    client = GitHubClient(GitHubCredentials(owner=owner, repo=repo, token=token))

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
    image_urls: list[tuple[str, str]] = []
    settings = get_settings()
    public_base = (settings.public_api_url or "").rstrip("/")

    for att in attachment_outs:
        label = att.file_name or att.label or att.kind
        if att.url and att.kind == "link":
            attachment_lines.append(f"Ссылка: {att.url}")
        elif att.download_url and public_base:
            full = f"{public_base}{att.download_url}"
            if row.include_media and att.is_image:
                image_urls.append((label, full))
            elif row.include_media:
                public_urls.append((label, full))
            else:
                attachment_lines.append(label)
        elif att.download_url:
            attachment_lines.append(label)

    body = build_issue_body(
        description=task.description,
        task_type=task.type,
        priority=task.priority,
        confidence=task.confidence,
        telegram_link=telegram_link if row.include_message_links else None,
        sender_name=msg.user_display_name if msg else None,
        chat_title=chat.title if chat else None,
        message_text=msg.text if msg else None,
        attachment_lines=attachment_lines,
        public_attachment_urls=public_urls if row.include_media else [],
        image_urls=image_urls if row.include_media else [],
    )

    available_labels: set[str] = set()
    try:
        available_labels = {lb.name for lb in await client.list_labels()}
    except Exception:
        logger.warning("Could not fetch GitHub labels for %s/%s", owner, repo)

    labels = _resolve_labels(row, task, available_labels)

    created = await client.create_issue(
        title=task.title,
        body=body,
        labels=labels or None,
    )

    issue_number = str(created.get("number", ""))
    html_url = created.get("html_url", "")
    if not issue_number or not html_url:
        raise ValueError("GitHub не вернул номер issue")

    ext = ExternalLink(
        task_id=task.id,
        provider="github",
        external_id=issue_number,
        url=html_url,
    )
    session.add(ext)
    await session.flush()
    logger.info("Pushed task %s to GitHub issue #%s", task.id, issue_number)
    return ext


async def auto_push_if_enabled(session: AsyncSession, task_id: UUID) -> ExternalLink | None:
    row = await get_github_config_row()
    if not row or not row.enabled or not row.auto_push:
        return None
    task = await load_task_for_github(session, task_id)
    if not task:
        return None
    try:
        return await push_task_to_github(session, task)
    except Exception:
        logger.exception("GitHub auto-push failed for task %s", task_id)
        return None
