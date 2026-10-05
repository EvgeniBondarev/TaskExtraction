"""Small global registry mapping Telegram sources to authenticated workspaces."""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path


def _db_path() -> Path:
    path = Path(os.environ.get("DATA_DIR", "/app/data")) / "source-registry.db"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connection() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path())
    conn.execute(
        """CREATE TABLE IF NOT EXISTS telegram_sources (
            kind TEXT NOT NULL, source_id TEXT NOT NULL PRIMARY KEY, tenant_key TEXT NOT NULL,
            title TEXT, avatar_path TEXT
        )"""
    )
    columns = {row[1] for row in conn.execute("PRAGMA table_info(telegram_sources)")}
    if "title" not in columns:
        conn.execute("ALTER TABLE telegram_sources ADD COLUMN title TEXT")
    if "avatar_path" not in columns:
        conn.execute("ALTER TABLE telegram_sources ADD COLUMN avatar_path TEXT")
    if "paused" not in columns:
        conn.execute("ALTER TABLE telegram_sources ADD COLUMN paused INTEGER NOT NULL DEFAULT 0")
    conn.execute(
        """CREATE TABLE IF NOT EXISTS telegram_preferences (
            tenant_key TEXT NOT NULL PRIMARY KEY,
            status_notifications_enabled INTEGER NOT NULL DEFAULT 1
        )"""
    )
    return conn


def set_source(
    kind: str,
    source_id: str | int,
    tenant_key: str,
    title: str | None = None,
    avatar_path: str | None = None,
) -> None:
    with _connection() as conn:
        conn.execute(
            "INSERT INTO telegram_sources(kind, source_id, tenant_key, title, avatar_path) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(source_id) DO UPDATE SET kind=excluded.kind, tenant_key=excluded.tenant_key, "
            "title=COALESCE(excluded.title, telegram_sources.title), "
            "avatar_path=COALESCE(excluded.avatar_path, telegram_sources.avatar_path)",
            (kind, str(source_id), tenant_key, title, avatar_path),
        )


def tenant_for_source(source_id: str | int) -> str | None:
    with _connection() as conn:
        row = conn.execute(
            "SELECT tenant_key FROM telegram_sources WHERE source_id = ?", (str(source_id),)
        ).fetchone()
    return str(row[0]) if row else None


def list_sources(tenant_key: str, kind: str) -> list[dict[str, str | None]]:
    with _connection() as conn:
        rows = conn.execute(
            "SELECT source_id, title, avatar_path, paused FROM telegram_sources "
            "WHERE tenant_key = ? AND kind = ? ORDER BY title, source_id",
            (tenant_key, kind),
        ).fetchall()
    return [
        {"source_id": str(row[0]), "title": row[1], "avatar_path": row[2], "paused": bool(row[3])}
        for row in rows
    ]


def is_source_paused(source_id: str | int) -> bool:
    with _connection() as conn:
        row = conn.execute(
            "SELECT paused FROM telegram_sources WHERE source_id = ?", (str(source_id),)
        ).fetchone()
    return bool(row[0]) if row else False


def set_source_paused(tenant_key: str, kind: str, source_id: str, paused: bool) -> bool:
    """Pause or resume a source owned by the workspace. Returns False when it does not exist."""
    with _connection() as conn:
        cur = conn.execute(
            "UPDATE telegram_sources SET paused = ? WHERE tenant_key = ? AND kind = ? AND source_id = ?",
            (int(paused), tenant_key, kind, source_id),
        )
    return cur.rowcount > 0


def remove_source(tenant_key: str, kind: str, source_id: str) -> bool:
    with _connection() as conn:
        cur = conn.execute(
            "DELETE FROM telegram_sources WHERE tenant_key = ? AND kind = ? AND source_id = ?",
            (tenant_key, kind, source_id),
        )
    return cur.rowcount > 0


def source_for(tenant_key: str, kind: str, source_id: str) -> dict[str, str | None] | None:
    with _connection() as conn:
        row = conn.execute(
            "SELECT source_id, title, avatar_path FROM telegram_sources "
            "WHERE tenant_key = ? AND kind = ? AND source_id = ?",
            (tenant_key, kind, source_id),
        ).fetchone()
    if not row:
        return None
    return {"source_id": str(row[0]), "title": row[1], "avatar_path": row[2]}


def status_notifications_enabled(tenant_key: str) -> bool:
    """Return the workspace preference; existing workspaces keep notifications enabled."""
    with _connection() as conn:
        row = conn.execute(
            "SELECT status_notifications_enabled FROM telegram_preferences WHERE tenant_key = ?",
            (tenant_key,),
        ).fetchone()
    return True if row is None else bool(row[0])


def set_status_notifications_enabled(tenant_key: str, enabled: bool) -> bool:
    with _connection() as conn:
        conn.execute(
            "INSERT INTO telegram_preferences(tenant_key, status_notifications_enabled) VALUES (?, ?) "
            "ON CONFLICT(tenant_key) DO UPDATE SET status_notifications_enabled = excluded.status_notifications_enabled",
            (tenant_key, int(enabled)),
        )
    return enabled
