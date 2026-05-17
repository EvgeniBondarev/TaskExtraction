"""Инициализация окружения до загрузки Settings (Docker / первый запуск)."""

import logging
import os
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

_FERNET_HINT = (
    'python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
)


def is_valid_fernet_key(key: str | None) -> bool:
    if not key or not str(key).strip():
        return False
    try:
        from cryptography.fernet import Fernet

        Fernet(str(key).strip().encode("ascii"))
        return True
    except (ValueError, TypeError):
        return False


def _generate_fernet_key() -> str:
    from cryptography.fernet import Fernet

    return Fernet.generate_key().decode("ascii")


def ensure_encryption_key() -> None:
    """
    Гарантирует валидный ENCRYPTION_KEY в os.environ.
    Невалидный ключ из env или файла игнорируется / пересоздаётся.
    """
    data_dir = Path(os.environ.get("DATA_DIR", "/app/data"))
    key_file = data_dir / ".encryption_key"

    env_key = (os.environ.get("ENCRYPTION_KEY") or "").strip()
    if env_key and is_valid_fernet_key(env_key):
        return

    if env_key:
        logger.error(
            "ENCRYPTION_KEY в окружении неверного формата (нужен Fernet, ~44 символа). "
            "Сгенерируйте: %s. Переменная будет проигнорирована.",
            _FERNET_HINT,
        )
        os.environ.pop("ENCRYPTION_KEY", None)

    if key_file.is_file():
        file_key = key_file.read_text(encoding="utf-8").strip()
        if file_key and is_valid_fernet_key(file_key):
            os.environ["ENCRYPTION_KEY"] = file_key
            logger.info("ENCRYPTION_KEY loaded from %s", key_file)
            _clear_settings_cache()
            return
        if file_key:
            backup = key_file.with_name(".encryption_key.invalid")
            try:
                if backup.exists():
                    backup.unlink()
                shutil.move(str(key_file), str(backup))
                logger.warning(
                    "Файл %s содержал неверный ключ — переименован в %s",
                    key_file,
                    backup.name,
                )
            except OSError as e:
                logger.warning("Could not backup invalid key file: %s", e)

    key = _generate_fernet_key()
    data_dir.mkdir(parents=True, exist_ok=True)
    key_file.write_text(key, encoding="utf-8")
    try:
        key_file.chmod(0o600)
    except OSError:
        pass
    os.environ["ENCRYPTION_KEY"] = key
    logger.info("ENCRYPTION_KEY generated at %s", key_file)
    _clear_settings_cache()


def _clear_settings_cache() -> None:
    try:
        from app.config import get_settings

        get_settings.cache_clear()
    except Exception:
        pass


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    ensure_encryption_key()
    print(os.environ.get("ENCRYPTION_KEY", ""))
