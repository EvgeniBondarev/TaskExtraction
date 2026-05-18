"""Глобальная БД аналитики (не per-tenant)."""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base

_engine = None
_factory: async_sessionmaker[AsyncSession] | None = None


def analytics_db_path() -> Path:
    root = Path(os.environ.get("DATA_DIR", "/app/data"))
    return root / "analytics.db"


def analytics_db_url() -> str:
    return f"sqlite+aiosqlite:///{analytics_db_path().resolve().as_posix()}"


def get_analytics_session_factory() -> async_sessionmaker[AsyncSession]:
    global _engine, _factory
    if _factory is None:
        path = analytics_db_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        _engine = create_async_engine(
            analytics_db_url(),
            echo=False,
            connect_args={"check_same_thread": False},
        )
        _factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)
    return _factory


async def init_analytics_db() -> None:
    from app.analytics import models  # noqa: F401

    factory = get_analytics_session_factory()
    async with factory() as session:
        conn = await session.connection()
        await conn.run_sync(Base.metadata.create_all)
