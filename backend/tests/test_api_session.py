import pytest
from httpx import AsyncClient

from tests.conftest import TEST_API_HASH, TEST_API_ID


@pytest.mark.asyncio
async def test_protected_route_requires_session(client: AsyncClient, clear_tenants):
    r = await client.get("/api/tasks")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_credentials_sets_session(authed_client: AsyncClient):
    r = await authed_client.get("/api/tasks")
    assert r.status_code == 200
    assert r.json()["items"] == []


@pytest.mark.asyncio
async def test_logout_clears_session(authed_client: AsyncClient):
    r = await authed_client.post("/api/session/logout")
    assert r.status_code == 200
    r_tasks = await authed_client.get("/api/tasks")
    assert r_tasks.status_code == 401
    r2 = await authed_client.post(
        "/api/telegram/credentials",
        json={"api_id": TEST_API_ID, "api_hash": TEST_API_HASH},
    )
    assert r2.status_code == 200
    r3 = await authed_client.get("/api/tasks")
    assert r3.status_code == 200


@pytest.mark.asyncio
async def test_single_tenant_on_disk_does_not_auto_bind(
    app, authed_client: AsyncClient, monkeypatch
):
    """Один tenant в data/ не должен открывать чужую панель без cookie."""
    from httpx import ASGITransport, AsyncClient

    from app.config import get_settings

    monkeypatch.delenv("TELEGRAM_API_ID", raising=False)
    monkeypatch.delenv("TELEGRAM_API_HASH", raising=False)
    get_settings.cache_clear()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as anon:
        r = await anon.get("/api/telegram/status")
        assert r.status_code == 200
        data = r.json()
        assert data["setup_complete"] is False
        assert data["has_credentials"] is False

        r_tasks = await anon.get("/api/tasks")
        assert r_tasks.status_code == 401
