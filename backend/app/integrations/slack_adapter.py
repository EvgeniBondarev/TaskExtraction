"""Slack adapter — posts task notifications to a channel."""

from app.database import async_session_factory
from app.integrations.base import ExternalRef
from app.models.entities import Task
from app.services.slack_sync import load_task_for_slack, push_task_to_slack


class SlackAdapter:
    provider = "slack"

    async def create_issue(self, task: Task, telegram_link: str | None = None) -> ExternalRef:
        async with async_session_factory() as session:
            loaded = await load_task_for_slack(session, task.id)
            if not loaded:
                raise ValueError("Task not found")
            ext = await push_task_to_slack(session, loaded)
            if not ext:
                raise ValueError("Задача уже отправлена в Slack")
            await session.commit()
            return ExternalRef(
                provider=self.provider,
                external_id=ext.external_id,
                url=ext.url,
            )

    async def close_issue(self, external_id: str) -> None:
        raise NotImplementedError("SlackAdapter.close_issue: not applicable for channel messages")
