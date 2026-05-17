from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings


def _fernet() -> Fernet:
    key = get_settings().encryption_key
    if not key:
        raise ValueError("ENCRYPTION_KEY is not set in environment")
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_str(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt_str(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken as e:
        raise ValueError("Failed to decrypt — check ENCRYPTION_KEY") from e
