import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified

from app.extraction.heuristics import combined_confidence, score_message
from app.extraction.llm import classify_message, extract_task_fields
from app.extraction.prefilter import analyze_prefilter, is_incident_report
from app.models.entities import Message, Task, TaskComment, TaskStatus
from app.services.message_attachments import message_has_attachments
from app.services.prompt_settings import get_prompt_config

logger = logging.getLogger(__name__)


async def process_message(session: AsyncSession, message_id: UUID) -> Task | TaskComment | None:
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
    pre = analyze_prefilter(message.text, has_media)
    prompts = await get_prompt_config()
    threshold = prompts.confidence_threshold

    if pre.skip:
        logger.debug("Prefilter skip message %s: %s", message.id, pre.reason)
        message.raw = message.raw or {}
        message.raw["classification"] = {
            "status": "prefilter_skip",
            "reason": pre.reason,
            "is_task": False,
            "threshold": threshold,
        }
        flag_modified(message, "raw")
        return None

    if not pre.should_call_llm:
        logger.debug("Prefilter skip LLM message %s: no signals", message.id)
        h = score_message(message.text)
        message.raw = message.raw or {}
        message.raw["classification"] = {
            "status": "no_signals",
            "is_task": False,
            "heuristic": h.score,
            "threshold": threshold,
            "reason": "Нет сигналов для классификатора",
        }
        flag_modified(message, "raw")
        return None

    heuristic = score_message(message.text)
    context = await _build_context(session, message, limit=2)

    classification = await classify_message(message.text or "", context)
    final_confidence = combined_confidence(heuristic.score, classification.confidence)
    incident = heuristic.incident_report or is_incident_report(message.text or "")
    # Classifier positive, or clear incident report (e.g. «студия не работает?») with decent AI score.
    passes_gate = (
        classification.is_task and classification.confidence >= threshold
    ) or (
        incident
        and heuristic.has_action_verb
        and classification.confidence >= min(0.50, threshold - 0.15)
    )
    effective_is_task = classification.is_task or (
        incident and heuristic.has_action_verb and passes_gate
    )

    if not passes_gate:
        skip_reason = (
            "not_task"
            if not effective_is_task
            else "ai_below_threshold"
        )
        logger.debug(
            "Not a task message %s: is_task=%s ai=%.2f combined=%.2f skip=%s reason=%s",
            message.id,
            classification.is_task,
            classification.confidence,
            final_confidence,
            skip_reason,
            classification.reason,
        )
        if message.raw is None:
            message.raw = {}
        message.raw["classification"] = {
            "status": "classified",
            "is_task": effective_is_task,
            "confidence": final_confidence,
            "ai_confidence": classification.confidence,
            "reason": classification.reason,
            "heuristic": heuristic.score,
            "threshold": threshold,
            "skip_reason": skip_reason,
            "incident_report": incident,
        }
        flag_modified(message, "raw")
        return None

    fields = await extract_task_fields(
        message.text or "",
        message.telegram_message_id,
        context,
    )

    task = Task(
        source_message_id=message.id,
        title=fields.title[:500] or "Без названия",
        description=fields.description,
        type=fields.type if fields.type in ("bug", "feature", "question", "other") else "other",
        priority=fields.priority if fields.priority in ("low", "medium", "high") else "medium",
        status=TaskStatus.inbox.value,
        confidence=round(final_confidence, 3),
    )
    session.add(task)
    await session.flush()

    if message.raw is None:
        message.raw = {}
    message.raw["classification"] = {
        "status": "classified",
        "is_task": True,
        "confidence": final_confidence,
        "ai_confidence": classification.confidence,
        "reason": classification.reason,
        "heuristic": heuristic.score,
        "threshold": threshold,
    }
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
