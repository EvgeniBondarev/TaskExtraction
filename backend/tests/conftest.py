"""Общие фикстуры: изолированный DATA_DIR, FastAPI client, tenant с тестовыми данными."""

from __future__ import annotations

import os
import tempfile
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from pathlib import Path

import pytest
from cryptography.fernet import Fernet
from httpx import ASGITransport, AsyncClient

# До импорта app.main
_test_root = Path(tempfile.mkdtemp(prefix="te_pytest_"))
os.environ["DATA_DIR"] = str(_test_root)
os.environ["ENCRYPTION_KEY"] = Fernet.generate_key().decode()
os.environ["TE_DISABLE_INGEST"] = "1"
os.environ["CORS_ORIGINS"] = "http://testserver"
os.environ["PUBLIC_API_URL"] = "http://testserver"
os.environ["ADMIN_USERNAME"] = "root"
os.environ["ADMIN_PASSWORD"] = "pytest-admin-password"

TEST_API_ID = 12345678
TEST_API_HASH = "a" * 32


@pytest.fixture(scope="session")
def test_data_dir() -> Path:
    return _test_root


@pytest.fixture
def clear_tenants():
    """Пустой tenants/ — без auto-bind единственного tenant."""
    import shutil

    from app.tenancy.paths import tenants_root
    from app.tenancy.registry import _engines, _factories

    root = tenants_root()
    if root.exists():
        shutil.rmtree(root)
    root.mkdir(parents=True, exist_ok=True)
    _engines.clear()
    _factories.clear()
    yield
    _engines.clear()
    _factories.clear()


@pytest.fixture(scope="session")
def app():
    from app.config import get_settings

    get_settings.cache_clear()
    from app.bootstrap import ensure_encryption_key

    ensure_encryption_key()
    from app.main import app as fastapi_app

    return fastapi_app


@pytest.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    from app.analytics.db import init_analytics_db

    await init_analytics_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest.fixture
async def authed_client(client: AsyncClient) -> AsyncGenerator[AsyncClient, None]:
    r = await client.post(
        "/api/telegram/credentials",
        json={"api_id": TEST_API_ID, "api_hash": TEST_API_HASH},
    )
    assert r.status_code == 200, r.text
    yield client


@pytest.fixture
async def seeded_task(authed_client: AsyncClient):
    """Chat + message + task в tenant БД; возвращает dict с id."""
    from app.models.entities import Chat, ExternalLink, Message, Task
    from app.tenancy import set_current_tenant
    from app.tenancy.registry import tenant_session

    tenant = str(TEST_API_ID)
    token = set_current_tenant(tenant)
    task_id = msg_id = chat_uuid = None
    try:
        async with tenant_session(tenant) as session:
            import random

            tg_chat_id = random.randint(10_000_000_000, 99_999_999_999)
            chat = Chat(
                telegram_chat_id=tg_chat_id,
                title="Test User",
                is_monitored=True,
                chat_type="private",
                username="testuser",
            )
            session.add(chat)
            await session.flush()
            chat_uuid = chat.id
            msg = Message(
                chat_id=chat.id,
                telegram_message_id=42,
                user_id=tg_chat_id,
                user_display_name="Tester",
                text="Сделай отчёт до пятницы",
                created_at=datetime.now(timezone.utc),
            )
            session.add(msg)
            await session.flush()
            msg_id = msg.id
            task = Task(
                source_message_id=msg.id,
                title="Отчёт до пятницы",
                description="Нужен отчёт",
                type="feature",
                priority="high",
                status="inbox",
                confidence=0.85,
            )
            session.add(task)
            await session.flush()
            task_id = task.id
            session.add(
                ExternalLink(
                    task_id=task.id,
                    provider="jira",
                    external_id="PROJ-1",
                    url="https://jira.example/browse/PROJ-1",
                )
            )
            await session.flush()
    finally:
        from app.tenancy import reset_current_tenant

        reset_current_tenant(token)

    r = await authed_client.get(f"/api/tasks/{task_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "Отчёт до пятницы"
    assert len(body["external_links"]) == 1
    assert body["external_links"][0]["provider"] == "jira"
    return {
        "task_id": str(task_id),
        "message_id": str(msg_id),
        "chat_id": str(chat_uuid),
        "task": body,
    }
