"""Список пользователей в админке."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

ADMIN_USER = "root"
ADMIN_PASS = "pytest-admin-password"


@pytest.fixture(autouse=True)
def admin_env(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", ADMIN_USER)
    monkeypatch.setenv("ADMIN_PASSWORD", ADMIN_PASS)


@pytest.mark.asyncio
async def test_admin_users_lists_tenants(authed_client, client):
    from app.models.entities import TelegramConfig
    from app.tenancy import set_current_tenant
    from app.tenancy.registry import tenant_session
    from tests.conftest import TEST_API_ID

    tenant = str(TEST_API_ID)
    token = set_current_tenant(tenant)
    try:
        from sqlalchemy import select

        async with tenant_session(tenant) as session:
            cfg = (
                await session.execute(
                    select(TelegramConfig).where(TelegramConfig.id == 1)
                )
            ).scalar_one_or_none()
            if cfg is None:
                cfg = TelegramConfig(id=1)
                session.add(cfg)
            cfg.is_authorized = True
            cfg.telegram_user_id = 999001
            cfg.telegram_username = "tester"
            cfg.telegram_first_name = "Иван"
            cfg.telegram_last_name = "Тестов"
            cfg.telegram_phone = "+79001234567"
            cfg.updated_at = datetime.now(timezone.utc)
            await session.flush()
    finally:
        from app.tenancy import reset_current_tenant

        reset_current_tenant(token)

    await client.post(
        "/api/analytics/event",
        json={
            "event_type": "registration",
            "tenant_api_id": tenant,
            "utm_source": "direct",
        },
    )

    r = await client.post(
        "/api/admin/login",
        json={"username": ADMIN_USER, "password": ADMIN_PASS},
    )
    assert r.status_code == 200

    r = await client.get("/api/admin/users")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 1
    user = next(u for u in data["users"] if u["api_id"] == tenant)
    assert user["telegram_username"] == "tester"
    assert user["telegram_first_name"] == "Иван"
    assert user["display_name"] == "Иван Тестов"
    assert user["is_authorized"] is True
    assert user["registered_at"] is not None


@pytest.mark.asyncio
async def test_admin_users_requires_auth(client):
    r = await client.get("/api/admin/users")
    assert r.status_code == 401
