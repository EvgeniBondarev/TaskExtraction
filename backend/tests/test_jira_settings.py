import pytest

from app.services.jira_settings import mask_token, row_to_dto
from app.models.entities import JiraConfig


def test_mask_token():
    assert mask_token("abcd") == "****"
    masked = mask_token("abcdefghijklmnop")
    assert "****" in masked
    assert masked.endswith("mnop")


def test_row_to_dto_empty():
    dto = row_to_dto(None)
    assert dto.is_configured is False
    assert dto.has_token is False


def test_row_to_dto_configured():
    row = JiraConfig(
        id=1,
        base_url="https://jira.example.com",
        email="a@b.com",
        api_token_encrypted="enc",
        project_key="PROJ",
        issue_type_id="1",
        enabled=True,
        auto_push=True,
    )
    dto = row_to_dto(row)
    assert dto.is_configured is True
    assert dto.has_token is True
    assert dto.enabled is True
