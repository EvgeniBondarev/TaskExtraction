"""Сводка зарегистрированных tenant (пользователей панели) для админки."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.models import AnalyticsEvent
from app.models.entities import (
    Chat,
    GitHubConfig,
    JiraConfig,
    LlmConfig,
    Message,
    SlackConfig,
    Task,
    TelegramConfig,
    TrelloConfig,
)
from app.tenancy.paths import tenant_db_path
from app.tenancy.registry import list_tenant_keys, tenant_session
from app.utils.crypto import decrypt_str

CONFIG_ID = 1


def _display_name(
    first: str | None,
    last: str | None,
    username: str | None,
) -> str | None:
    parts = [p for p in (first, last) if p]
    if parts:
        return " ".join(parts)
    if username:
        return f"@{username}" if not username.startswith("@") else username
    return None


def _enabled_integrations(
    jira: JiraConfig | None,
    trello: TrelloConfig | None,
    github: GitHubConfig | None,
    slack: SlackConfig | None,
) -> list[str]:
    out: list[str] = []
    if jira and jira.enabled:
        out.append("jira")
    if trello and trello.enabled:
        out.append("trello")
    if github and github.enabled:
        out.append("github")
    if slack and slack.enabled:
        out.append("slack")
    return out


async def _tenant_row(tenant_key: str) -> dict:
    async with tenant_session(tenant_key) as session:
        cfg = (
            await session.execute(
                select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
            )
        ).scalar_one_or_none()

        monitored = await session.scalar(
            select(func.count()).select_from(Chat).where(Chat.is_monitored.is_(True))
        ) or 0
        total_chats = await session.scalar(select(func.count()).select_from(Chat)) or 0
        tasks_count = await session.scalar(select(func.count()).select_from(Task)) or 0
        messages_count = await session.scalar(select(func.count()).select_from(Message)) or 0
        last_message_at = await session.scalar(select(func.max(Message.created_at)))

        jira = (
            await session.execute(select(JiraConfig).where(JiraConfig.id == CONFIG_ID))
        ).scalar_one_or_none()
        trello = (
            await session.execute(select(TrelloConfig).where(TrelloConfig.id == CONFIG_ID))
        ).scalar_one_or_none()
        github = (
            await session.execute(select(GitHubConfig).where(GitHubConfig.id == CONFIG_ID))
        ).scalar_one_or_none()
        slack = (
            await session.execute(select(SlackConfig).where(SlackConfig.id == CONFIG_ID))
        ).scalar_one_or_none()
        llm = (
            await session.execute(select(LlmConfig).where(LlmConfig.id == CONFIG_ID))
        ).scalar_one_or_none()

    app_title: str | None = None
    if cfg and cfg.app_title_encrypted:
        try:
            app_title = decrypt_str(cfg.app_title_encrypted)
        except Exception:
            app_title = None

    has_credentials = bool(cfg and cfg.api_id_encrypted and cfg.api_hash_encrypted)
    integrations = _enabled_integrations(jira, trello, github, slack)
    if llm and llm.user_api_key_encrypted:
        integrations.append("llm")

    db_path = tenant_db_path(tenant_key)
    db_created: datetime | None = None
    if db_path.is_file():
        db_created = datetime.fromtimestamp(db_path.stat().st_ctime, tz=timezone.utc)

    return {
        "api_id": tenant_key,
        "display_name": _display_name(
            cfg.telegram_first_name if cfg else None,
            cfg.telegram_last_name if cfg else None,
            cfg.telegram_username if cfg else None,
        ),
        "telegram_username": cfg.telegram_username if cfg else None,
        "telegram_first_name": cfg.telegram_first_name if cfg else None,
        "telegram_last_name": cfg.telegram_last_name if cfg else None,
        "telegram_phone": cfg.telegram_phone if cfg else None,
        "telegram_user_id": cfg.telegram_user_id if cfg else None,
        "app_title": app_title,
        "has_credentials": has_credentials,
        "is_authorized": bool(cfg and cfg.is_authorized),
        "monitored_chats": int(monitored),
        "total_chats": int(total_chats),
        "tasks_count": int(tasks_count),
        "messages_count": int(messages_count),
        "integrations": integrations,
        "updated_at": cfg.updated_at if cfg else None,
        "last_message_at": last_message_at,
        "db_created_at": db_created,
    }


async def _registration_times(
    analytics_session: AsyncSession,
) -> dict[str, datetime]:
    q = (
        select(
            AnalyticsEvent.tenant_api_id,
            func.min(AnalyticsEvent.created_at).label("registered_at"),
        )
        .where(
            AnalyticsEvent.event_type == "registration",
            AnalyticsEvent.tenant_api_id.is_not(None),
        )
        .group_by(AnalyticsEvent.tenant_api_id)
    )
    rows = (await analytics_session.execute(q)).all()
    out: dict[str, datetime] = {}
    for row in rows:
        if row.tenant_api_id:
            out[str(row.tenant_api_id)] = row.registered_at
    return out


async def list_admin_users() -> dict:
    keys = list_tenant_keys()
    from app.analytics.db import get_analytics_session_factory

    factory = get_analytics_session_factory()
    async with factory() as analytics_session:
        reg_map = await _registration_times(analytics_session)

    users: list[dict] = []
    for key in keys:
        row = await _tenant_row(key)
        registered_at = reg_map.get(key) or row.pop("db_created_at")
        row["registered_at"] = registered_at
        users.append(row)

    users.sort(
        key=lambda u: u.get("registered_at") or u.get("updated_at") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return {"total": len(users), "users": users}
