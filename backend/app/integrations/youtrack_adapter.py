"""YouTrack adapter stub — implement with YOUTRACK_* env vars."""

from app.integrations.base import ExternalRef
from app.models.entities import Task


class YouTrackAdapter:
    provider = "youtrack"

    async def create_issue(self, task: Task, telegram_link: str | None = None) -> ExternalRef:
        raise NotImplementedError(
            "YouTrackAdapter: configure YOUTRACK_BASE_URL, YOUTRACK_TOKEN, YOUTRACK_PROJECT_ID"
        )

    async def close_issue(self, external_id: str) -> None:
        raise NotImplementedError("YouTrackAdapter.close_issue not implemented")
