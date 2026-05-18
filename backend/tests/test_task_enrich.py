from datetime import datetime, timezone
from uuid import uuid4

from app.models.entities import Chat, ExternalLink, Message, Task
from app.utils.task_enrich import enrich_task_out


def test_enrich_task_out_with_links():
    chat = Chat(telegram_chat_id=-1002056938512, title="Team", chat_type="supergroup")
    msg = Message(
        id=uuid4(),
        chat_id=chat.id,
        telegram_message_id=99,
        user_display_name="Alice",
        created_at=datetime.now(timezone.utc),
    )
    msg.chat = chat
    task_id = uuid4()
    task = Task(
        id=task_id,
        source_message_id=msg.id,
        title="Bug",
        type="bug",
        priority="medium",
        status="inbox",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    task.source_message = msg
    link_id = uuid4()
    task.external_links = [
        ExternalLink(
            id=link_id,
            task_id=task_id,
            provider="github",
            external_id="42",
            url="https://github.com/o/r/issues/42",
        )
    ]
    out = enrich_task_out(task, None)
    assert out.telegram_link == "https://t.me/c/2056938512/99"
    assert out.source_is_group is True
    assert len(out.external_links) == 1
    assert out.external_links[0].provider == "github"
