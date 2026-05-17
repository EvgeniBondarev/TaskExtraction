"""Jira Cloud adapter — uses DB-stored integration settings."""

from app.database import async_session_factory
from app.integrations.base import ExternalRef
from app.models.entities import Task
from app.schemas.tasks import ExternalLinkOut
from app.services.jira_sync import load_task_for_jira, push_task_to_jira


class JiraAdapter:
    provider = "jira"

    async def create_issue(self, task: Task, telegram_link: str | None = None) -> ExternalRef:
        async with async_session_factory() as session:
            loaded = await load_task_for_jira(session, task.id)
            if not loaded:
                raise ValueError("Task not found")
            ext = await push_task_to_jira(session, loaded)
            if not ext:
                raise ValueError("Задача уже отправлена в Jira")
            await session.commit()
            return ExternalRef(
                provider=self.provider,
                external_id=ext.external_id,
                url=ext.url,
            )

    async def close_issue(self, external_id: str) -> None:
        raise NotImplementedError("JiraAdapter.close_issue: use Jira UI or implement transitions API")
