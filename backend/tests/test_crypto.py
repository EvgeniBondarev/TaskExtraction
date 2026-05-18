import pytest

from app.utils.crypto import decrypt_str, encrypt_str, encryption_configured


def test_encrypt_decrypt_roundtrip():
    assert encryption_configured()
    plain = "secret-token-123"
    token = encrypt_str(plain)
    assert token != plain
    assert decrypt_str(token) == plain


def test_decrypt_wrong_key_raises():
    from app.utils.crypto import encrypt_str as enc

    token = enc("x")
    import os

    old = os.environ["ENCRYPTION_KEY"]
    from cryptography.fernet import Fernet

    os.environ["ENCRYPTION_KEY"] = Fernet.generate_key().decode()
    from app.config import get_settings

    get_settings.cache_clear()
    with pytest.raises(ValueError, match="расшифровать"):
        decrypt_str(token)
    os.environ["ENCRYPTION_KEY"] = old
    get_settings.cache_clear()
