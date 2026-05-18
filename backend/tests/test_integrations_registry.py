import pytest

from app.integrations.registry import get_adapter


def test_get_adapter_known():
    assert get_adapter("jira").provider == "jira"
    assert get_adapter("trello").provider == "trello"
    assert get_adapter("github").provider == "github"
    assert get_adapter("slack").provider == "slack"


def test_get_adapter_unknown():
    with pytest.raises(ValueError, match="Unknown provider"):
        get_adapter("asana")
