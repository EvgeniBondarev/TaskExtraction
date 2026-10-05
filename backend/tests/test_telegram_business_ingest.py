from datetime import datetime, timezone

import pytest
from sqlalchemy import select

from app.models.entities import Chat, Message
from app.services.telegram_bot import BotMessage
from app.tenancy import reset_current_tenant, set_current_tenant
from app.tenancy.registry import tenant_session


@pytest.mark.asyncio
async def test_business_message_is_not_filtered_by_monitored_group(authed_client, monkeypatch):
    """A Business chat is authorized by Telegram, independently of group monitoring."""
    from app.telegram import ingest

    async def no_task(*_args, **_kwargs):
        return None

    monkeypatch.setattr(ingest, "process_message", no_task)
    tenant = "12345678"
    token = set_current_tenant(tenant)
    try:
        async with tenant_session(tenant) as session:
            session.add(
                Chat(
                    telegram_chat_id=-100123,
                    title="Рабочая группа",
                    chat_type="supergroup",
                    is_monitored=True,
                )
            )
            await session.commit()

        await ingest.handle_new_message(
            BotMessage(
                id=57,
                chat_id=998877,
                text="Нужно подготовить отчёт до пятницы",
                date=datetime.now(timezone.utc),
                sender_id=998877,
                sender_name="Вася",
                chat_title="Вася Си",
                chat_type="private",
                reply_to_id=None,
                raw={
                    "source": "telegram_business",
                    "business_connection_id": "business-test",
                },
            )
        )

        async with tenant_session(tenant) as session:
            message = (
                await session.execute(
                    select(Message).where(Message.telegram_message_id == 57)
                )
            ).scalar_one()
            assert message.text == "Нужно подготовить отчёт до пятницы"
            chat = await session.get(Chat, message.chat_id)
            assert chat and chat.telegram_chat_id == 998877
            assert chat.is_monitored is True
    finally:
        reset_current_tenant(token)


@pytest.mark.asyncio
async def test_business_message_saves_bot_api_profile(authed_client, monkeypatch):
    from app.telegram import ingest

    async def no_task(*_args, **_kwargs):
        return None

    async def fake_avatar(user_id: int):
        assert user_id == 445566
        return "/tmp/business-user.jpg"

    monkeypatch.setattr(ingest, "process_message", no_task)
    monkeypatch.setattr("app.services.telegram_bot.cache_business_user_avatar", fake_avatar)
    tenant = "12345678"
    token = set_current_tenant(tenant)
    try:
        await ingest.handle_new_message(
            BotMessage(
                id=58,
                chat_id=445566,
                text="Добрый день",
                date=datetime.now(timezone.utc),
                sender_id=445566,
                sender_name="Публичное имя",
                chat_title="Публичное имя",
                chat_type="private",
                reply_to_id=None,
                raw={"source": "telegram_business", "business_connection_id": "business-test"},
            )
        )
        from app.models.entities import TelegramProfile

        async with tenant_session(tenant) as session:
            profile = await session.get(TelegramProfile, 445566)
            assert profile and profile.display_name == "Публичное имя"
            assert profile.photo_path == "/tmp/business-user.jpg"
    finally:
        reset_current_tenant(token)
