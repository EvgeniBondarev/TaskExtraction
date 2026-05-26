"""Общее Telegram-приложение владельца сервиса (api_id/api_hash из env)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import NamedTuple

from sqlalchemy import select

from app.config import get_settings
from app.models.entities import TelegramConfig
from app.tenancy.registry import tenant_session
from app.utils.crypto import decrypt_str, encrypt_str

CONFIG_ID = 1


class SharedTelegramCredentials(NamedTuple):
    api_id: int
    api_hash: str


def is_hosted_mode() -> bool:
    settings = get_settings()
    return bool(settings.telegram_api_id and settings.telegram_api_hash.strip())


def shared_credentials() -> SharedTelegramCredentials | None:
    settings = get_settings()
    if not is_hosted_mode():
        return None
    return SharedTelegramCredentials(
        api_id=int(settings.telegram_api_id),
        api_hash=settings.telegram_api_hash.strip(),
    )


async def ensure_hosted_credentials_for_tenant(tenant_key: str) -> None:
    """Записать общие ключи в tenant-БД (сессия пользователя хранится отдельно)."""
    creds = shared_credentials()
    if not creds:
        return

    app_meta = {
        "api_id": creds.api_id,
        "source": "hosted_env",
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }

    async with tenant_session(tenant_key) as session:
        result = await session.execute(
            select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
        )
        row = result.scalar_one_or_none()
        if not row:
            row = TelegramConfig(id=CONFIG_ID)
            session.add(row)

        if not row.api_id_encrypted or not row.api_hash_encrypted:
            row.api_id_encrypted = encrypt_str(str(creds.api_id))
            row.api_hash_encrypted = encrypt_str(creds.api_hash)
            row.app_metadata_encrypted = encrypt_str(json.dumps(app_meta, ensure_ascii=False))
            row.updated_at = datetime.now(timezone.utc)


def resolve_app_credentials(row: TelegramConfig | None) -> SharedTelegramCredentials | None:
    shared = shared_credentials()
    if shared:
        return shared
    if not row or not row.api_id_encrypted or not row.api_hash_encrypted:
        return None
    return SharedTelegramCredentials(
        api_id=int(decrypt_str(row.api_id_encrypted)),
        api_hash=decrypt_str(row.api_hash_encrypted),
    )


def credentials_configured(row: TelegramConfig | None) -> bool:
    if is_hosted_mode():
        return True
    return bool(row and row.api_id_encrypted and row.api_hash_encrypted)
