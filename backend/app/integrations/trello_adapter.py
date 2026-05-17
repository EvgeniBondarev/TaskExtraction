"""Trello adapter — uses DB-stored integration settings."""

from app.tenancy.registry import tenant_session
from app.integrations.base import ExternalRef
from app.models.entities import Task
from app.services.trello_sync import load_task_for_trello, push_task_to_trello


class TrelloAdapter:
    provider = "trello"

    async def create_issue(self, task: Task, telegram_link: str | None = None) -> ExternalRef:
        async with tenant_session() as session:
            loaded = await load_task_for_trello(session, task.id)
            if not loaded:
                raise ValueError("Task not found")
            ext = await push_task_to_trello(session, loaded)
            if not ext:
                raise ValueError("Задача уже отправлена в Trello")
            await session.commit()
            return ExternalRef(
                provider=self.provider,
                external_id=ext.external_id,
                url=ext.url,
            )

    async def close_issue(self, external_id: str) -> None:
        raise NotImplementedError("TrelloAdapter.close_issue: archive card in Trello UI")
