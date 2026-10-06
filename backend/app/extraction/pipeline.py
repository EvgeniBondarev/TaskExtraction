import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified

from app.extraction.analysis import analyze_text, resolve_type_priority
from app.extraction.llm import extract_task_fields
from app.models.entities import Message, Task, TaskComment, TaskStatus
from app.services.message_attachments import message_has_attachments
from app.services.prompt_settings import get_prompt_config

logger = logging.getLogger(__name__)


async def process_message(
    session: AsyncSession, message_id: UUID, *, force_create: bool = False
) -> Task | TaskComment | None:
    """Rules → classifier → score → extractor → task."""
    result = await session.execute(
        select(Message)
        .where(Message.id == message_id)
        .options(
            selectinload(Message.chat),
            selectinload(Message.task),
            selectinload(Message.attachments),
        )
    )
    message = result.scalar_one_or_none()
    if not message:
        return None

    if message.task:
        return message.task

    parent_task = await _find_parent_task(session, message)
    if parent_task:
        comment = TaskComment(
            task_id=parent_task.id,
            message_id=message.id,
            text=message.text or "",
        )
        session.add(comment)
        await session.flush()
        return comment

    has_media = message_has_attachments(message)
    prompts = await get_prompt_config()
    analysis = await analyze_text(
        message.text,
        prompts=prompts,
        has_media=has_media,
        force_create=force_create,
        context_loader=lambda: _build_context(session, message, limit=2),
    )

    if not analysis.passes_gate:
        logger.debug(
            "Not a task message %s: status=%s confidence=%s skip=%s reason=%s",
            message.id,
            analysis.status,
            analysis.confidence,
            analysis.skip_reason,
            analysis.reason,
        )
        message.raw = message.raw or {}
        message.raw["classification"] = analysis.classification()
        flag_modified(message, "raw")
        return None

    decision = analysis.decision
    final_confidence = analysis.confidence or 0.0
    fields = await extract_task_fields(
        message.text or "",
        message.telegram_message_id,
        analysis.context,
        prompts=prompts,
    )

    task_type, priority = resolve_type_priority(decision, fields.type, fields.priority)
    task = Task(
        source_message_id=message.id,
        title=fields.title[:500] or "Без названия",
        description=fields.description,
        type=task_type,
        priority=priority,
        status=TaskStatus.inbox.value,
        confidence=round(final_confidence, 3),
    )
    session.add(task)
    await session.flush()

    if message.raw is None:
        message.raw = {}
    message.raw["classification"] = analysis.classification(created=True)
    flag_modified(message, "raw")

    logger.info(
        "Created task %s from message %s (conf=%.2f)",
        task.id,
        message.id,
        final_confidence,
    )

    from app.services.github_sync import auto_push_if_enabled as github_auto_push
    from app.services.jira_sync import auto_push_if_enabled
    from app.services.slack_sync import auto_push_if_enabled as slack_auto_push
    from app.services.trello_sync import auto_push_if_enabled as trello_auto_push

    await auto_push_if_enabled(session, task.id)
    await trello_auto_push(session, task.id)
    await github_auto_push(session, task.id)
    await slack_auto_push(session, task.id)

    return task


async def _find_parent_task(session: AsyncSession, message: Message) -> Task | None:
    if not message.reply_to_telegram_id:
        return None
    parent_msg = await session.execute(
        select(Message)
        .where(
            Message.chat_id == message.chat_id,
            Message.telegram_message_id == message.reply_to_telegram_id,
        )
        .options(selectinload(Message.task))
    )
    parent = parent_msg.scalar_one_or_none()
    if parent and parent.task:
        return parent.task
    return None


async def _build_context(session: AsyncSession, message: Message, limit: int = 2) -> list[str]:
    q = (
        select(Message)
        .where(Message.chat_id == message.chat_id, Message.created_at <= message.created_at)
        .where(Message.id != message.id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    rows = (await session.execute(q)).scalars().all()
    lines = []
    for m in reversed(rows):
        lines.append(f"[{m.telegram_message_id}] {m.text or '(медиа)'}")
    return lines
