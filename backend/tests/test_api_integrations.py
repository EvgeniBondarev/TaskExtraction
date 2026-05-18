import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_jira_status_unconfigured(authed_client: AsyncClient):
    r = await authed_client.get("/api/integrations/jira/status")
    assert r.status_code == 200
    data = r.json()
    assert data["is_configured"] is False
    assert data["enabled"] is False


@pytest.mark.asyncio
async def test_trello_status_unconfigured(authed_client: AsyncClient):
    r = await authed_client.get("/api/integrations/trello/status")
    assert r.status_code == 200
    assert r.json()["is_configured"] is False


@pytest.mark.asyncio
async def test_github_status_unconfigured(authed_client: AsyncClient):
    r = await authed_client.get("/api/integrations/github/status")
    assert r.status_code == 200
    assert r.json()["is_configured"] is False


@pytest.mark.asyncio
async def test_slack_status_unconfigured(authed_client: AsyncClient):
    r = await authed_client.get("/api/integrations/slack/status")
    assert r.status_code == 200
    assert r.json()["is_configured"] is False


@pytest.mark.asyncio
async def test_telegram_status_public(client: AsyncClient):
    r = await client.get("/api/telegram/status")
    assert r.status_code == 200
    data = r.json()
    assert "has_credentials" in data
    assert "setup_complete" in data
