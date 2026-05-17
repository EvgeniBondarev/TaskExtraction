"""GitHub Issues adapter — uses DB-stored integration settings."""

from app.tenancy.registry import tenant_session
from app.integrations.base import ExternalRef
from app.models.entities import Task
from app.services.github_sync import load_task_for_github, push_task_to_github


class GitHubAdapter:
    provider = "github"

    async def create_issue(self, task: Task, telegram_link: str | None = None) -> ExternalRef:
        async with tenant_session() as session:
            loaded = await load_task_for_github(session, task.id)
            if not loaded:
                raise ValueError("Task not found")
            ext = await push_task_to_github(session, loaded)
            if not ext:
                raise ValueError("Задача уже отправлена в GitHub")
            await session.commit()
            return ExternalRef(
                provider=self.provider,
                external_id=ext.external_id,
                url=ext.url,
            )

    async def close_issue(self, external_id: str) -> None:
        raise NotImplementedError("GitHubAdapter.close_issue: close via GitHub UI or implement PATCH")
