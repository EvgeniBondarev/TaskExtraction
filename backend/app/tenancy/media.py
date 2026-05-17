"""Медиа-файлы tenant."""

from __future__ import annotations

from app.config import get_settings
from app.tenancy.context import get_current_tenant, require_current_tenant
from app.tenancy.paths import tenant_media_dir


def effective_media_dir() -> str:
    tenant = get_current_tenant()
    if tenant:
        path = tenant_media_dir(tenant)
        path.mkdir(parents=True, exist_ok=True)
        return str(path)
    return get_settings().media_dir
