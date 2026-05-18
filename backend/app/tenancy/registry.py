"""Реестр БД и сессий SQLAlchemy по tenant."""

from __future__ import annotations

import logging
import shutil
from collections.abc import AsyncGenerator
from pathlib import Path
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base
from app.tenancy.paths import (
    tenant_db_path,
    tenant_db_url,
    tenant_db_url_sync,
    tenant_dir,
    tenant_media_dir,
    tenants_root,
)

logger = logging.getLogger(__name__)

_engines: dict[str, object] = {}
_factories: dict[str, async_sessionmaker[AsyncSession]] = {}


def list_tenant_keys() -> list[str]:
    root = tenants_root()
    if not root.is_dir():
        return []
    keys: list[str] = []
    for child in root.iterdir():
        if child.is_dir() and (child / "taskextraction.db").is_file():
            keys.append(child.name)
    return sorted(keys)


def migrate_all_tenant_databases() -> None:
    """Alembic upgrade для каждой tenant-БД (entrypoint мигрирует только legacy path)."""
    from alembic import command
    from alembic.config import Config

    keys = list_tenant_keys()
    if not keys:
        return
    ini_path = Path(__file__).resolve().parents[2] / "alembic.ini"
    for key in keys:
        ensure_tenant(key)
        cfg = Config(str(ini_path))
        cfg.set_main_option("sqlalchemy.url", tenant_db_url(key))
        try:
            command.upgrade(cfg, "head")
            logger.info("Alembic upgrade head for tenant api_id=%s", key)
        except Exception as exc:
            logger.warning("Alembic upgrade failed for tenant %s: %s", key, exc)


def run_tenant_migrations(tenant_key: str) -> None:
    from sqlalchemy import create_engine

    from app.database import Base
    from app.models import entities  # noqa: F401

    engine = create_engine(
        tenant_db_url_sync(tenant_key),
        connect_args={"check_same_thread": False},
    )
    try:
        Base.metadata.create_all(engine)
    finally:
        engine.dispose()


def ensure_tenant(tenant_key: str) -> None:
    from app.tenancy.paths import normalize_tenant_key

    key = normalize_tenant_key(tenant_key)
    tdir = tenant_dir(key)
    tdir.mkdir(parents=True, exist_ok=True)
    tenant_media_dir(key).mkdir(parents=True, exist_ok=True)
    db_path = tenant_db_path(key)
    if not db_path.exists():
        db_path.touch()
        run_tenant_migrations(key)
        logger.info("Initialized tenant database api_id=%s", key)
    elif key not in _factories:
        run_tenant_migrations(key)


def get_session_factory(tenant_key: str) -> async_sessionmaker[AsyncSession]:
    ensure_tenant(tenant_key)
    if tenant_key not in _factories:
        engine = create_async_engine(
            tenant_db_url(tenant_key),
            echo=False,
            connect_args={"check_same_thread": False},
        )
        _engines[tenant_key] = engine
        _factories[tenant_key] = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
    return _factories[tenant_key]


@asynccontextmanager
async def tenant_session(tenant_key: str | None = None) -> AsyncGenerator[AsyncSession, None]:
    from app.tenancy.context import get_current_tenant, require_current_tenant

    key = tenant_key or get_current_tenant() or require_current_tenant()
    factory = get_session_factory(key)
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def remove_tenant(tenant_key: str) -> None:
    from app.tenancy.paths import normalize_tenant_key

    key = normalize_tenant_key(tenant_key)
    _factories.pop(key, None)
    eng = _engines.pop(key, None)
    if eng is not None:
        import asyncio

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(eng.dispose())  # type: ignore[attr-defined]
            else:
                asyncio.run(eng.dispose())  # type: ignore[attr-defined]
        except Exception:
            pass
    tdir = tenant_dir(key)
    if tdir.is_dir():
        shutil.rmtree(tdir, ignore_errors=True)
