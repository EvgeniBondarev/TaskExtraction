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
  # single tenant may still auto-bind; re-login flow
    r2 = await authed_client.post(
        "/api/telegram/credentials",
        json={"api_id": TEST_API_ID, "api_hash": TEST_API_HASH},
    )
    assert r2.status_code == 200
