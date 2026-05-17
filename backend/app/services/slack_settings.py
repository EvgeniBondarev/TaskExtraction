from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select

from app.tenancy.registry import tenant_session
from app.models.entities import SlackConfig
from app.utils.crypto import decrypt_str, encrypt_str

CONFIG_ID = 1


@dataclass
class SlackConfigDTO:
    has_token: bool
    token_masked: str | None
    channel_id: str | None
    channel_name: str | None
    workspace_name: str | None
    workspace_url: str | None
    enabled: bool
    auto_push: bool
    include_media: bool
    include_message_links: bool
    mention_channel: bool
    is_configured: bool


async def _get_row() -> SlackConfig | None:
    async with tenant_session() as session:
        result = await session.execute(select(SlackConfig).where(SlackConfig.id == CONFIG_ID))
        return result.scalar_one_or_none()


async def _ensure_row(session) -> SlackConfig:
    result = await session.execute(select(SlackConfig).where(SlackConfig.id == CONFIG_ID))
    row = result.scalar_one_or_none()
    if not row:
        row = SlackConfig(id=CONFIG_ID)
        session.add(row)
        await session.flush()
    return row


def row_to_dto(row: SlackConfig | None) -> SlackConfigDTO:
    if not row:
        return SlackConfigDTO(
            has_token=False,
            token_masked=None,
            channel_id=None,
            channel_name=None,
            workspace_name=None,
            workspace_url=None,
            enabled=False,
            auto_push=False,
            include_media=True,
            include_message_links=True,
            mention_channel=False,
            is_configured=False,
        )
    has_token = bool(row.bot_token_encrypted)
    configured = bool(has_token and row.channel_id)
    return SlackConfigDTO(
        has_token=has_token,
        token_masked="••••••••" if has_token else None,
        channel_id=row.channel_id,
        channel_name=row.channel_name,
        workspace_name=row.workspace_name,
        workspace_url=row.workspace_url,
        enabled=row.enabled,
        auto_push=row.auto_push,
        include_media=row.include_media,
        include_message_links=row.include_message_links,
        mention_channel=row.mention_channel,
        is_configured=configured,
    )


async def get_slack_status() -> SlackConfigDTO:
    return row_to_dto(await _get_row())


async def get_slack_token() -> str | None:
    row = await _get_row()
    if not row or not row.bot_token_encrypted:
        return None
    try:
        return decrypt_str(row.bot_token_encrypted)
    except ValueError:
        return None


async def get_slack_config_row() -> SlackConfig | None:
    return await _get_row()


async def save_slack_settings(
    *,
    bot_token: str | None = None,
    clear_token: bool = False,
    channel_id: str | None = None,
    channel_name: str | None = None,
    workspace_name: str | None = None,
    workspace_url: str | None = None,
    enabled: bool | None = None,
    auto_push: bool | None = None,
    include_media: bool | None = None,
    include_message_links: bool | None = None,
    mention_channel: bool | None = None,
) -> SlackConfigDTO:
    async with tenant_session() as session:
        row = await _ensure_row(session)
        if bot_token:
            row.bot_token_encrypted = encrypt_str(bot_token.strip())
        elif clear_token:
            row.bot_token_encrypted = None
        if channel_id is not None:
            row.channel_id = channel_id or None
        if channel_name is not None:
            row.channel_name = channel_name or None
        if workspace_name is not None:
            row.workspace_name = workspace_name or None
        if workspace_url is not None:
            row.workspace_url = workspace_url or None
        if enabled is not None:
            row.enabled = enabled
        if auto_push is not None:
            row.auto_push = auto_push
        if include_media is not None:
            row.include_media = include_media
        if include_message_links is not None:
            row.include_message_links = include_message_links
        if mention_channel is not None:
            row.mention_channel = mention_channel
        await session.commit()
        await session.refresh(row)
        return row_to_dto(row)
