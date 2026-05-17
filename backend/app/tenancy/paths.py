"""Пути данных tenant — изоляция по Telegram api_id приложения."""

from __future__ import annotations

import os
import re
from pathlib import Path

_TENANT_KEY_RE = re.compile(r"^\d{1,16}$")


def data_root() -> Path:
    return Path(os.environ.get("DATA_DIR", "/app/data"))


def tenants_root() -> Path:
    return data_root() / "tenants"


def normalize_tenant_key(api_id: int | str) -> str:
    key = str(api_id).strip()
    if not _TENANT_KEY_RE.match(key):
        raise ValueError("Некорректный Telegram api_id")
    return key


def tenant_dir(tenant_key: str) -> Path:
    normalize_tenant_key(tenant_key)
    return tenants_root() / tenant_key


def tenant_db_path(tenant_key: str) -> Path:
    return tenant_dir(tenant_key) / "taskextraction.db"


def tenant_db_url(tenant_key: str) -> str:
    path = tenant_db_path(tenant_key).resolve()
    return f"sqlite+aiosqlite:///{path.as_posix()}"


def tenant_db_url_sync(tenant_key: str) -> str:
    path = tenant_db_path(tenant_key).resolve()
    return f"sqlite:///{path.as_posix()}"


def tenant_media_dir(tenant_key: str) -> Path:
    return tenant_dir(tenant_key) / "media"


def legacy_db_path() -> Path:
    url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./data/taskextraction.db")
    if "///" in url:
        raw = url.split("///", 1)[-1]
        return Path(raw)
    return data_root() / "taskextraction.db"


def legacy_media_dir() -> Path:
    return Path(os.environ.get("MEDIA_DIR", str(data_root() / "media")))
