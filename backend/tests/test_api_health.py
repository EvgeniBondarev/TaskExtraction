import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "ingest" in data


@pytest.mark.asyncio
async def test_api_health_requires_session(client: AsyncClient, clear_tenants):
    r = await client.get("/api/health")
    assert r.status_code == 401
