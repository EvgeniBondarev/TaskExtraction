from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.entities import Message, Task, TaskComment, TelegramProfile
from app.utils.task_enrich import enrich_task_out

_TASK_LOAD_OPTIONS = (
    selectinload(Task.source_message).selectinload(Message.chat),
    selectinload(Task.source_message).selectinload(Message.attachments),
    selectinload(Task.comments).selectinload(TaskComment.message).selectinload(Message.attachments),
    selectinload(Task.external_links),
)


def task_to_ws_payload(task: Task, profile: TelegramProfile | None = None) -> dict:
    return enrich_task_out(task, profile).model_dump(mode="json")


async def load_task_for_broadcast(session: AsyncSession, task_id: UUID) -> dict | None:
    result = await session.execute(
        select(Task).where(Task.id == task_id).options(*_TASK_LOAD_OPTIONS)
    )
    task = result.scalar_one_or_none()
    if not task:
        return None
    profile = None
    if task.source_message and task.source_message.user_id:
        pr = await session.execute(
            select(TelegramProfile).where(
                TelegramProfile.telegram_user_id == task.source_message.user_id
            )
        )
        profile = pr.scalar_one_or_none()
    return task_to_ws_payload(task, profile)
