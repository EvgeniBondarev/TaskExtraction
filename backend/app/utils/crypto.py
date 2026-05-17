from cryptography.fernet import Fernet, InvalidToken

from app.bootstrap import _FERNET_HINT, is_valid_fernet_key
from app.config import get_settings


def _fernet() -> Fernet:
    key = (get_settings().encryption_key or "").strip()
    if not key:
        raise ValueError(
            "ENCRYPTION_KEY не задан. Перезапустите контейнер — ключ создаётся в /app/data/.encryption_key. "
            f"Или сгенерируйте: {_FERNET_HINT}"
        )
    if not is_valid_fernet_key(key):
        raise ValueError(
            f"ENCRYPTION_KEY неверного формата (нужен Fernet, ~44 символа, не пароль и не random base64). "
            f"Сгенерируйте: {_FERNET_HINT}"
        )
    return Fernet(key.encode("ascii"))


def encryption_configured() -> bool:
    return is_valid_fernet_key((get_settings().encryption_key or "").strip())


def encrypt_str(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt_str(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken as e:
        raise ValueError(
            "Не удалось расшифровать данные — ENCRYPTION_KEY не совпадает с ключом при сохранении"
        ) from e
