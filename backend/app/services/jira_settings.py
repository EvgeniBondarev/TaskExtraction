from __future__ import annotations

import logging
from dataclasses import dataclass

from sqlalchemy import select

from app.database import async_session_factory
from app.models.entities import JiraConfig
from app.utils.crypto import decrypt_str, encrypt_str

logger = logging.getLogger(__name__)
CONFIG_ID = 1


@dataclass
class JiraConfigDTO:
    base_url: str | None
    email: str | None
    has_token: bool
    token_masked: str | None
    project_key: str | None
    project_name: str | None
    issue_type_id: str | None
    issue_type_name: str | None
    enabled: bool
    auto_push: bool
    include_media: bool
    include_message_links: bool
    is_configured: bool


def mask_token(token: str) -> str:
    if len(token) <= 8:
        return "****"
    return token[:4] + "****" + token[-4:]


async def _get_row() -> JiraConfig | None:
    async with async_session_factory() as session:
        result = await session.execute(select(JiraConfig).where(JiraConfig.id == CONFIG_ID))
        return result.scalar_one_or_none()


async def _ensure_row(session) -> JiraConfig:
    result = await session.execute(select(JiraConfig).where(JiraConfig.id == CONFIG_ID))
    row = result.scalar_one_or_none()
    if not row:
        row = JiraConfig(id=CONFIG_ID)
        session.add(row)
        await session.flush()
    return row


def row_to_dto(row: JiraConfig | None) -> JiraConfigDTO:
    if not row:
        return JiraConfigDTO(
            base_url=None,
            email=None,
            has_token=False,
            token_masked=None,
            project_key=None,
            project_name=None,
            issue_type_id=None,
            issue_type_name=None,
            enabled=False,
            auto_push=False,
            include_media=True,
            include_message_links=True,
            is_configured=False,
        )
    has_token = bool(row.api_token_encrypted)
    configured = bool(row.base_url and row.email and has_token and row.project_key and row.issue_type_id)
    return JiraConfigDTO(
        base_url=row.base_url,
        email=row.email,
        has_token=has_token,
        token_masked="••••••••" if has_token else None,
        project_key=row.project_key,
        project_name=row.project_name,
        issue_type_id=row.issue_type_id,
        issue_type_name=row.issue_type_name,
        enabled=row.enabled,
        auto_push=row.auto_push,
        include_media=row.include_media,
        include_message_links=row.include_message_links,
        is_configured=configured,
    )


async def get_jira_status() -> JiraConfigDTO:
    return row_to_dto(await _get_row())


async def get_jira_credentials() -> tuple[str, str, str] | None:
    row = await _get_row()
    if not row or not row.base_url or not row.email or not row.api_token_encrypted:
        return None
    try:
        token = decrypt_str(row.api_token_encrypted)
    except ValueError:
        return None
    return row.base_url, row.email, token


async def get_jira_config_row() -> JiraConfig | None:
    return await _get_row()


async def save_jira_settings(
    *,
    base_url: str | None = None,
    email: str | None = None,
    api_token: str | None = None,
    clear_token: bool = False,
    project_key: str | None = None,
    project_name: str | None = None,
    issue_type_id: str | None = None,
    issue_type_name: str | None = None,
    enabled: bool | None = None,
    auto_push: bool | None = None,
    include_media: bool | None = None,
    include_message_links: bool | None = None,
) -> JiraConfigDTO:
    async with async_session_factory() as session:
        row = await _ensure_row(session)
        if base_url is not None:
            row.base_url = base_url.strip().rstrip("/") if base_url else None
        if email is not None:
            row.email = email.strip() if email else None
        if api_token:
            row.api_token_encrypted = encrypt_str(api_token.strip())
        elif clear_token:
            row.api_token_encrypted = None
        if project_key is not None:
            row.project_key = project_key or None
        if project_name is not None:
            row.project_name = project_name or None
        if issue_type_id is not None:
            row.issue_type_id = issue_type_id or None
        if issue_type_name is not None:
            row.issue_type_name = issue_type_name or None
        if enabled is not None:
            row.enabled = enabled
        if auto_push is not None:
            row.auto_push = auto_push
        if include_media is not None:
            row.include_media = include_media
        if include_message_links is not None:
            row.include_message_links = include_message_links
        await session.commit()
        await session.refresh(row)
        return row_to_dto(row)
