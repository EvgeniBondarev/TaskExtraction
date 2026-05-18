from unittest.mock import AsyncMock, MagicMock

import pytest
from telethon.tl.types import User

from datetime import datetime, timezone
from uuid import uuid4

from app.models.entities import Chat, Message
from app.utils.telegram_entity_resolve import resolve_chat_input_entity


@pytest.mark.asyncio
async def test_resolve_by_username():
    client = AsyncMock()
    client.get_input_entity = AsyncMock(return_value="peer-by-username")
    chat = Chat(telegram_chat_id=6985943091, username="testuser", chat_type="private")
    peer = await resolve_chat_input_entity(client, chat, None)
    assert peer == "peer-by-username"
    client.get_input_entity.assert_awaited_with("testuser")


@pytest.mark.asyncio
async def test_resolve_via_dialogs():
    client = AsyncMock()
    client.get_input_entity = AsyncMock(side_effect=ValueError("no cache"))
    dialog = MagicMock()
    dialog.id = 6985943091
    dialog.input_entity = "peer-from-dialog"
    dialog.entity = User(id=6985943091, access_hash=1, first_name="T")

    async def _dialogs():
        yield dialog

    client.iter_dialogs = MagicMock(return_value=_dialogs())
    chat = Chat(id=uuid4(), telegram_chat_id=6985943091, chat_type="unknown")
    msg = Message(
        chat_id=chat.id,
        telegram_message_id=1,
        user_id=6985943091,
        created_at=datetime.now(timezone.utc),
    )
    peer = await resolve_chat_input_entity(client, chat, msg)
    assert peer == "peer-from-dialog"
    assert chat.chat_type == "private"


@pytest.mark.asyncio
async def test_resolve_fails_without_dialog():
    client = AsyncMock()
    client.get_input_entity = AsyncMock(side_effect=ValueError("no cache"))

    async def _empty():
        return
        yield  # pragma: no cover

    client.iter_dialogs = MagicMock(return_value=_empty())
    chat = Chat(telegram_chat_id=111, chat_type="private")
    with pytest.raises(ValueError, match="Could not find"):
        await resolve_chat_input_entity(client, chat, None)
