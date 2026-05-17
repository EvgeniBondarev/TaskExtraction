"""Перенос старой единой БД/медиа в каталог tenant по api_id."""

from __future__ import annotations

import logging
import shutil
import sqlite3

from app.tenancy.paths import legacy_db_path, legacy_media_dir, tenant_db_path, tenant_dir, tenant_media_dir
from app.tenancy.registry import ensure_tenant, list_tenant_keys

logger = logging.getLogger(__name__)


def _read_legacy_api_id(db_path) -> str | None:
    if not db_path.is_file():
        return None
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute(
            "SELECT api_id_encrypted FROM telegram_config WHERE id = 1 LIMIT 1"
        )
        row = cur.fetchone()
        conn.close()
        if not row or not row[0]:
            return None
        from app.utils.crypto import decrypt_str

        return str(int(decrypt_str(row[0])))
    except Exception as exc:
        logger.warning("Legacy DB migration skipped: %s", exc)
        return None


def migrate_legacy_installation() -> str | None:
    """Если есть старая БД без tenants — переносим в tenants/{api_id}/."""
    if list_tenant_keys():
        return None

    legacy_db = legacy_db_path()
    api_id = _read_legacy_api_id(legacy_db)
    if not api_id:
        return None

    ensure_tenant(api_id)
    target_db = tenant_db_path(api_id)
    if not target_db.exists() or target_db.stat().st_size == 0:
        shutil.copy2(legacy_db, target_db)
        logger.info("Migrated legacy database to tenant api_id=%s", api_id)

    legacy_media = legacy_media_dir()
    target_media = tenant_media_dir(api_id)
    if legacy_media.is_dir() and any(legacy_media.iterdir()):
        if not any(target_media.iterdir()) if target_media.exists() else True:
            shutil.copytree(legacy_media, target_media, dirs_exist_ok=True)
            logger.info("Migrated legacy media to tenant api_id=%s", api_id)

    backup = legacy_db.parent / "taskextraction.db.migrated"
    if legacy_db.exists() and not backup.exists():
        legacy_db.rename(backup)

    return api_id
