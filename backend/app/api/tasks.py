from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_session
from app.extraction.pipeline import process_message
from app.integrations.registry import get_adapter
from app.models.entities import ExternalLink, Message, Task, TaskComment, TaskFeedback, TaskStatus, TelegramProfile
from app.schemas.tasks import ExternalLinkOut, TaskList, TaskOut, TaskUpdate
from app.utils.task_enrich import enrich_task_out

router = APIRouter(prefix="/tasks", tags=["tasks"])

_TASK_LOAD_OPTIONS = (
    selectinload(Task.source_message).selectinload(Message.chat),
    selectinload(Task.source_message).selectinload(Message.attachments),
    selectinload(Task.comments).selectinload(TaskComment.message).selectinload(Message.attachments),
    selectinload(Task.external_links),
)


async def _load_profiles(session: AsyncSession, user_ids: set[int]) -> dict[int, TelegramProfile]:
    if not user_ids:
        return {}
    result = await session.execute(
        select(TelegramProfile).where(TelegramProfile.telegram_user_id.in_(user_ids))
    )
    return {p.telegram_user_id: p for p in result.scalars().all()}


def _profile_for_task(task: Task, profiles: dict[int, TelegramProfile]) -> TelegramProfile | None:
    if not task.source_message or not task.source_message.user_id:
        return None
    return profiles.get(task.source_message.user_id)


async def _enrich_tasks(session: AsyncSession, tasks: list[Task]) -> list[TaskOut]:
    user_ids = {t.source_message.user_id for t in tasks if t.source_message and t.source_message.user_id}
    profiles = await _load_profiles(session, user_ids)
    return [enrich_task_out(t, _profile_for_task(t, profiles)) for t in tasks]


@router.get("", response_model=TaskList)
async def list_tasks(
    status: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
):
    q = select(Task).options(*_TASK_LOAD_OPTIONS)
    if status:
        q = q.where(Task.status == status)
    q = q.order_by(Task.created_at.desc())
    result = await session.execute(q)
    tasks = list(result.scalars().all())
    items = await _enrich_tasks(session, tasks)
    return TaskList(items=items, total=len(items))


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: UUID, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD_OPTIONS)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    profiles = await _load_profiles(
        session,
        {task.source_message.user_id} if task.source_message and task.source_message.user_id else set(),
    )
    return enrich_task_out(task, _profile_for_task(task, profiles))


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD_OPTIONS)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await session.flush()
    await session.refresh(task)
    profiles = await _load_profiles(
        session,
        {task.source_message.user_id} if task.source_message and task.source_message.user_id else set(),
    )
    return enrich_task_out(task, _profile_for_task(task, profiles))


@router.post("/{task_id}/dismiss", response_model=TaskOut)
async def dismiss_task(task_id: UUID, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD_OPTIONS)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    task.status = TaskStatus.archive.value
    session.add(TaskFeedback(task_id=task.id, reason="not_a_task"))
    await session.flush()
    await session.refresh(task)
    profiles = await _load_profiles(
        session,
        {task.source_message.user_id} if task.source_message and task.source_message.user_id else set(),
    )
    return enrich_task_out(task, _profile_for_task(task, profiles))


@router.post("/reprocess/{message_id}", response_model=TaskOut | None)
async def reprocess_message(message_id: UUID, session: AsyncSession = Depends(get_session)):
    task = await process_message(session, message_id)
    if not task or not hasattr(task, "source_message_id"):
        return None
    result = await session.execute(
        select(Task).where(Task.id == task.id).options(*_TASK_LOAD_OPTIONS)
    )
    loaded = result.scalar_one()
    profiles = await _load_profiles(
        session,
        {loaded.source_message.user_id} if loaded.source_message and loaded.source_message.user_id else set(),
    )
    return enrich_task_out(loaded, _profile_for_task(loaded, profiles))


@router.post("/{task_id}/push/{provider}", response_model=ExternalLinkOut)
async def push_to_tracker(
    task_id: UUID,
    provider: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD_OPTIONS)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    link = None
    if task.source_message and task.source_message.chat:
        from app.utils.telegram_link import build_telegram_message_link

        link = build_telegram_message_link(
            task.source_message.chat.telegram_chat_id,
            task.source_message.telegram_message_id,
        )

    adapter = get_adapter(provider)
    try:
        ref = await adapter.create_issue(task, link)
    except NotImplementedError as e:
        raise HTTPException(501, str(e)) from e
    except ValueError as e:
        raise HTTPException(400, str(e)) from e

    ext = ExternalLink(
        task_id=task.id,
        provider=ref.provider,
        external_id=ref.external_id,
        url=ref.url,
    )
    session.add(ext)
    await session.flush()
    return ExternalLinkOut.model_validate(ext)
