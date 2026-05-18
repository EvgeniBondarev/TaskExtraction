import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_tasks_empty(authed_client: AsyncClient):
    r = await authed_client.get("/api/tasks")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []


@pytest.mark.asyncio
async def test_get_task_with_external_links(authed_client: AsyncClient, seeded_task):
    task_id = seeded_task["task_id"]
    r = await authed_client.get(f"/api/tasks/{task_id}")
    assert r.status_code == 200
    task = r.json()
    assert task["title"] == "Отчёт до пятницы"
    assert task["telegram_link"]
    assert len(task["external_links"]) == 1
    assert task["external_links"][0]["url"].startswith("https://jira")


@pytest.mark.asyncio
async def test_update_task_status(authed_client: AsyncClient, seeded_task):
    task_id = seeded_task["task_id"]
    r = await authed_client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"})
    assert r.status_code == 200
    assert r.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_task_not_found(authed_client: AsyncClient):
    r = await authed_client.get("/api/tasks/00000000-0000-0000-0000-000000000099")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_reply_preview(authed_client: AsyncClient, seeded_task):
    task_id = seeded_task["task_id"]
    r = await authed_client.get(f"/api/tasks/{task_id}/reply-telegram/preview")
    assert r.status_code == 200
    data = r.json()
    assert "text" in data
    assert "panel_url" in data
    assert "Отчёт" in data["text"] or task_id in data["panel_url"]
