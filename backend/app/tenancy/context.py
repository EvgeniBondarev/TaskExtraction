"""Контекст текущего tenant (api_id) в async-запросе и ingest."""

from __future__ import annotations

from contextvars import ContextVar, Token

_tenant_key: ContextVar[str | None] = ContextVar("tenant_api_id", default=None)


def set_current_tenant(tenant_key: str) -> Token:
    from app.tenancy.paths import normalize_tenant_key

    return _tenant_key.set(normalize_tenant_key(tenant_key))


def reset_current_tenant(token: Token) -> None:
    _tenant_key.reset(token)


def get_current_tenant() -> str | None:
    return _tenant_key.get()


def require_current_tenant() -> str:
    key = get_current_tenant()
    if not key:
        raise RuntimeError("Tenant context is not set")
    return key
