"""Запись и агрегация аналитики."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.db import get_analytics_session_factory
from app.analytics.models import AnalyticsEvent, AnalyticsVisit


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def record_visit(
    *,
    visitor_id: str,
    session_id: str,
    tenant_api_id: str | None = None,
    utm_source: str | None = None,
    utm_medium: str | None = None,
    utm_campaign: str | None = None,
    utm_content: str | None = None,
    referrer: str | None = None,
    landing_path: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    factory = get_analytics_session_factory()
    async with factory() as session:
        session.add(
            AnalyticsVisit(
                visitor_id=visitor_id[:64],
                session_id=session_id[:64],
                tenant_api_id=(tenant_api_id or None),
                utm_source=_trim(utm_source, 128),
                utm_medium=_trim(utm_medium, 128),
                utm_campaign=_trim(utm_campaign, 128),
                utm_content=_trim(utm_content, 128),
                referrer=_trim(referrer, 2000),
                landing_path=_trim(landing_path, 512),
                ip_address=_trim(ip_address, 64),
                user_agent=_trim(user_agent, 500),
            )
        )
        await session.commit()


async def record_event(
    *,
    event_type: str,
    visitor_id: str | None = None,
    tenant_api_id: str | None = None,
    utm_source: str | None = None,
    utm_medium: str | None = None,
    utm_campaign: str | None = None,
    utm_content: str | None = None,
) -> None:
    factory = get_analytics_session_factory()
    async with factory() as session:
        session.add(
            AnalyticsEvent(
                event_type=event_type[:32],
                visitor_id=visitor_id[:64] if visitor_id else None,
                tenant_api_id=(tenant_api_id or None),
                utm_source=_trim(utm_source, 128),
                utm_medium=_trim(utm_medium, 128),
                utm_campaign=_trim(utm_campaign, 128),
                utm_content=_trim(utm_content, 128),
            )
        )
        await session.commit()


def _trim(value: str | None, max_len: int) -> str | None:
    if not value:
        return None
    s = value.strip()
    return s[:max_len] if s else None


def _parse_range(date_from: datetime | None, date_to: datetime | None, days: int) -> tuple[datetime, datetime]:
    end = date_to or _utc_now()
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    start = date_from
    if start is None:
        start = end - timedelta(days=max(1, days))
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return start, end


async def get_admin_stats(
    session: AsyncSession,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    days: int = 30,
) -> dict[str, Any]:
    start, end = _parse_range(date_from, date_to, days)

    visits_q = select(func.count()).select_from(AnalyticsVisit).where(
        AnalyticsVisit.created_at >= start,
        AnalyticsVisit.created_at <= end,
    )
    unique_visitors_q = select(func.count(func.distinct(AnalyticsVisit.visitor_id))).where(
        AnalyticsVisit.created_at >= start,
        AnalyticsVisit.created_at <= end,
    )

    def events_count(event_type: str):
        return select(func.count()).select_from(AnalyticsEvent).where(
            AnalyticsEvent.event_type == event_type,
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
        )

    visits = (await session.execute(visits_q)).scalar() or 0
    unique_visitors = (await session.execute(unique_visitors_q)).scalar() or 0
    registrations = (await session.execute(events_count("registration"))).scalar() or 0
    logins = (await session.execute(events_count("login"))).scalar() or 0
    setup_complete = (await session.execute(events_count("setup_complete"))).scalar() or 0

    by_source = await session.execute(
        select(
            func.coalesce(AnalyticsVisit.utm_source, "(direct)").label("source"),
            func.count().label("visits"),
            func.count(func.distinct(AnalyticsVisit.visitor_id)).label("unique_visitors"),
        )
        .where(AnalyticsVisit.created_at >= start, AnalyticsVisit.created_at <= end)
        .group_by("source")
        .order_by(func.count().desc())
    )
    sources = [
        {"utm_source": row.source, "visits": row.visits, "unique_visitors": row.unique_visitors}
        for row in by_source
    ]

    reg_by_source = await session.execute(
        select(
            func.coalesce(AnalyticsEvent.utm_source, "(direct)").label("source"),
            func.count().label("registrations"),
        )
        .where(
            AnalyticsEvent.event_type == "registration",
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at <= end,
        )
        .group_by("source")
        .order_by(func.count().desc())
    )
    reg_map = {row.source: row.registrations for row in reg_by_source}
    for row in sources:
        row["registrations"] = reg_map.get(row["utm_source"], 0)
        row["conversion_pct"] = round(
            (row["registrations"] / row["visits"] * 100) if row["visits"] else 0.0,
            1,
        )

    by_medium = await session.execute(
        select(
            func.coalesce(AnalyticsVisit.utm_medium, "(none)").label("medium"),
            func.count().label("visits"),
        )
        .where(AnalyticsVisit.created_at >= start, AnalyticsVisit.created_at <= end)
        .group_by("medium")
        .order_by(func.count().desc())
        .limit(20)
    )

    by_campaign = await session.execute(
        select(
            func.coalesce(AnalyticsVisit.utm_campaign, "(none)").label("campaign"),
            func.coalesce(AnalyticsVisit.utm_source, "(direct)").label("source"),
            func.count().label("visits"),
        )
        .where(AnalyticsVisit.created_at >= start, AnalyticsVisit.created_at <= end)
        .group_by("campaign", "source")
        .order_by(func.count().desc())
        .limit(30)
    )

    return {
        "period": {"from": start.isoformat(), "to": end.isoformat(), "days": days},
        "totals": {
            "visits": visits,
            "unique_visitors": unique_visitors,
            "registrations": registrations,
            "logins": logins,
            "setup_complete": setup_complete,
            "conversion_pct": round((registrations / visits * 100) if visits else 0.0, 1),
        },
        "by_source": sources,
        "by_medium": [{"utm_medium": r.medium, "visits": r.visits} for r in by_medium],
        "by_campaign": [
            {"utm_campaign": r.campaign, "utm_source": r.source, "visits": r.visits}
            for r in by_campaign
        ],
    }


async def get_timeseries(
    session: AsyncSession,
    *,
    metric: str,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    days: int = 30,
) -> list[dict[str, Any]]:
    start, end = _parse_range(date_from, date_to, days)
    day_col = func.date(
        AnalyticsEvent.created_at if metric in ("registrations", "logins") else AnalyticsVisit.created_at
    )
    if metric == "registrations":
        q = (
            select(day_col.label("day"), func.count().label("count"))
            .select_from(AnalyticsEvent)
            .where(
                AnalyticsEvent.event_type == "registration",
                AnalyticsEvent.created_at >= start,
                AnalyticsEvent.created_at <= end,
            )
            .group_by("day")
            .order_by("day")
        )
    elif metric == "logins":
        q = (
            select(day_col.label("day"), func.count().label("count"))
            .select_from(AnalyticsEvent)
            .where(
                AnalyticsEvent.event_type == "login",
                AnalyticsEvent.created_at >= start,
                AnalyticsEvent.created_at <= end,
            )
            .group_by("day")
            .order_by("day")
        )
    else:
        q = (
            select(day_col.label("day"), func.count().label("count"))
            .select_from(AnalyticsVisit)
            .where(AnalyticsVisit.created_at >= start, AnalyticsVisit.created_at <= end)
            .group_by("day")
            .order_by("day")
        )

    rows = (await session.execute(q)).all()
    return [{"date": str(row.day), "count": row.count} for row in rows]
