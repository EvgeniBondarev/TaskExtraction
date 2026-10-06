"""Product analytics exposed inside the panel to one configured Google account."""

from datetime import datetime
import hmac

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.analytics.db import get_analytics_session_factory
from app.analytics.service import get_admin_stats, get_timeseries
from app.config import get_settings
from app.services.admin_users import list_admin_users

router = APIRouter(prefix="/owner-analytics", tags=["owner-analytics"])


def require_analytics_owner(request: Request) -> str:
    """Authorize from the Google session, never from a client-provided email."""
    expected = get_settings().analytics_owner_email.strip().casefold()
    profile = request.session.get("google_profile") or {}
    email = str(profile.get("email") or request.session.get("google_email") or "").strip().casefold()
    if not expected or not email or not hmac.compare_digest(email, expected):
        raise HTTPException(status_code=403, detail="Analytics access is restricted")
    return email


@router.get("/access")
async def owner_analytics_access(_email: str = Depends(require_analytics_owner)):
    return {"allowed": True}


@router.get("/users")
async def owner_analytics_users(_email: str = Depends(require_analytics_owner)):
    return await list_admin_users()


@router.get("/stats")
async def owner_analytics_stats(
    _email: str = Depends(require_analytics_owner),
    days: int = Query(30, ge=1, le=365),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    factory = get_analytics_session_factory()
    async with factory() as session:
        return await get_admin_stats(session, date_from=date_from, date_to=date_to, days=days)


@router.get("/stats/timeseries")
async def owner_analytics_timeseries(
    _email: str = Depends(require_analytics_owner),
    metric: str = Query("visits", pattern="^(visits|registrations|logins)$"),
    days: int = Query(30, ge=1, le=365),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    factory = get_analytics_session_factory()
    async with factory() as session:
        points = await get_timeseries(
            session, metric=metric, date_from=date_from, date_to=date_to, days=days
        )
    return {"metric": metric, "points": points}
