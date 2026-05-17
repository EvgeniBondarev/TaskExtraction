from dataclasses import dataclass
from typing import Protocol

from app.models.entities import Task


@dataclass
class ExternalRef:
    provider: str
    external_id: str
    url: str


class IssueTrackerPort(Protocol):
    async def create_issue(self, task: Task, telegram_link: str | None) -> ExternalRef: ...

    async def close_issue(self, external_id: str) -> None: ...
