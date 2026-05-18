from app.secrets.builtin_openrouter import DEFAULT_MODEL, get_builtin_openrouter_api_key
from app.services.llm_settings import mask_api_key


def test_builtin_openrouter_key_loads():
    key = get_builtin_openrouter_api_key()
    assert key.startswith("sk-or-v1-")
    assert len(key) > 20


def test_mask_api_key_hides_middle():
    masked = mask_api_key("sk-or-v1-abcdefghijklmnopqrstuvwxyz")
    assert "****" in masked
    assert masked.endswith("wxyz")
    assert "abcdefghijklmnopqrst" not in masked


def test_default_model():
    assert DEFAULT_MODEL == "deepseek/deepseek-v3.2"
