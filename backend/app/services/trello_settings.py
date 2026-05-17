from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote

from sqlalchemy import select

from app.database import async_session_factory
from app.models.entities import TrelloConfig
from app.utils.crypto import decrypt_str, encrypt_str

CONFIG_ID = 1
APP_NAME = "TaskExtraction"


@dataclass
class TrelloConfigDTO:
    api_key: str | None
    has_token: bool
    token_masked: str | None
    board_id: str | None
    board_name: str | None
    list_id: str | None
    list_name: str | None
    enabled: bool
    auto_push: bool
    include_media: bool
    include_message_links: bool
    is_configured: bool
    authorize_url: str | None


def build_authorize_url(api_key: str) -> str:
    key = quote(api_key.strip(), safe="")
    name = quote(APP_NAME, safe="")
    return (
        "https://trello.com/1/authorize"
        f"?expiration=never&name={name}&scope=read,write"
        f"&response_type=token&key={key}"
    )


async def _get_row() -> TrelloConfig | None:
    async with async_session_factory() as session:
        result = await session.execute(select(TrelloConfig).where(TrelloConfig.id == CONFIG_ID))
        return result.scalar_one_or_none()


async def _ensure_row(session) -> TrelloConfig:
    result = await session.execute(select(TrelloConfig).where(TrelloConfig.id == CONFIG_ID))
    row = result.scalar_one_or_none()
    if not row:
        row = TrelloConfig(id=CONFIG_ID)
        session.add(row)
        await session.flush()
    return row


def row_to_dto(row: TrelloConfig | None) -> TrelloConfigDTO:
    if not row:
        return TrelloConfigDTO(
            api_key=None,
            has_token=False,
            token_masked=None,
            board_id=None,
            board_name=None,
            list_id=None,
            list_name=None,
            enabled=False,
            auto_push=False,
            include_media=True,
            include_message_links=True,
            is_configured=False,
            authorize_url=None,
        )
    has_token = bool(row.token_encrypted)
    configured = bool(row.api_key and has_token and row.list_id)
    auth_url = build_authorize_url(row.api_key) if row.api_key else None
    return TrelloConfigDTO(
        api_key=row.api_key,
        has_token=has_token,
        token_masked="••••••••" if has_token else None,
        board_id=row.board_id,
        board_name=row.board_name,
        list_id=row.list_id,
        list_name=row.list_name,
        enabled=row.enabled,
        auto_push=row.auto_push,
        include_media=row.include_media,
        include_message_links=row.include_message_links,
        is_configured=configured,
        authorize_url=auth_url,
    )


async def get_trello_status() -> TrelloConfigDTO:
    return row_to_dto(await _get_row())


async def get_trello_credentials() -> tuple[str, str] | None:
    row = await _get_row()
    if not row or not row.api_key or not row.token_encrypted:
        return None
    try:
        token = decrypt_str(row.token_encrypted)
    except ValueError:
        return None
    return row.api_key, token


async def get_trello_config_row() -> TrelloConfig | None:
    return await _get_row()


async def save_trello_settings(
    *,
    api_key: str | None = None,
    token: str | None = None,
    clear_token: bool = False,
    board_id: str | None = None,
    board_name: str | None = None,
    list_id: str | None = None,
    list_name: str | None = None,
    enabled: bool | None = None,
    auto_push: bool | None = None,
    include_media: bool | None = None,
    include_message_links: bool | None = None,
) -> TrelloConfigDTO:
    async with async_session_factory() as session:
        row = await _ensure_row(session)
        if api_key is not None:
            row.api_key = api_key.strip() if api_key else None
        if token:
            row.token_encrypted = encrypt_str(token.strip())
        elif clear_token:
            row.token_encrypted = None
        if board_id is not None:
            row.board_id = board_id or None
        if board_name is not None:
            row.board_name = board_name or None
        if list_id is not None:
            row.list_id = list_id or None
        if list_name is not None:
            row.list_name = list_name or None
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
