import pytest
from starlette.requests import Request

from app.tenancy.http import (
    is_public_path,
    session_secret,
)
from app.tenancy.paths import normalize_tenant_key, tenant_db_path, tenant_dir
from app.tenancy.registry import ensure_tenant, list_tenant_keys


def test_normalize_tenant_key():
    assert normalize_tenant_key(12345) == "12345"
    with pytest.raises(ValueError):
        normalize_tenant_key("not-valid")


def test_tenant_paths():
    ensure_tenant("99999")
    assert tenant_dir("99999").is_dir()
    assert tenant_db_path("99999").name == "taskextraction.db"
    assert "99999" in list_tenant_keys()


def test_is_public_path():
    assert is_public_path("/health") is True
    assert is_public_path("/api/telegram/status") is True
    assert is_public_path("/api/integrations/jira/status") is False
    assert is_public_path("/api/telegram/credentials", "POST") is True


def test_session_secret_non_empty():
    assert len(session_secret()) >= 16


def test_list_tenant_keys_empty_after_clear(clear_tenants):
    assert list_tenant_keys() == []
