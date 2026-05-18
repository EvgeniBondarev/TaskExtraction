from uuid import uuid4

from app.models.entities import Task
from app.services.telegram_reply import (
    build_default_reply_text,
    build_task_panel_url,
    _normalize_reply_text,
)
from fastapi import HTTPException
import pytest


def test_build_task_panel_url():
    tid = uuid4()
    assert build_task_panel_url(tid, "https://panel.example.com") == f"https://panel.example.com/?task={tid}"
    assert build_task_panel_url(tid, None) == f"/?task={tid}"


def test_build_default_reply_text():
    task = Task(
        source_message_id=uuid4(),
        title="Задача",
        status="in_progress",
        assignee="Иван",
    )
    text = build_default_reply_text(task, "https://x.test/?task=1")
    assert "Задача" in text
    assert "В работе" in text
    assert "Иван" in text
    assert "https://x.test/?task=1" in text


def test_normalize_reply_text():
    assert _normalize_reply_text("  hello  ") == "hello"
    with pytest.raises(HTTPException) as exc:
        _normalize_reply_text("   ")
    assert exc.value.status_code == 400
