import os

from app.bootstrap import ensure_encryption_key, is_valid_fernet_key


def test_is_valid_fernet_key():
    from cryptography.fernet import Fernet

    key = Fernet.generate_key().decode()
    assert is_valid_fernet_key(key) is True
    assert is_valid_fernet_key("not-a-fernet-key") is False
    assert is_valid_fernet_key("") is False


def test_ensure_encryption_key_sets_env():
    ensure_encryption_key()
    assert is_valid_fernet_key(os.environ.get("ENCRYPTION_KEY"))
