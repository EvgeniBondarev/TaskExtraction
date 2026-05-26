from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request, Response

from app.admin_auth import (
    ADMIN_COOKIE,
    ADMIN_MAX_AGE,
    clear_admin_session,
    create_admin_token,
    require_admin,
    set_admin_session,
    verify_admin_login,
)
from app.analytics.db import get_analytics_session_factory
from app.analytics.service import get_admin_stats, get_timeseries
from app.schemas.admin_users import AdminUsersOut
from app.schemas.analytics import AdminLoginIn, AdminLoginOut
from app.services.admin_users import list_admin_users

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", response_model=AdminLoginOut)
async def admin_login(body: AdminLoginIn, request: Request, response: Response):
    if not verify_admin_login(body.username, body.password):
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    set_admin_session(request, body.username.strip())
    token = create_admin_token(body.username.strip())
    response.set_cookie(
        ADMIN_COOKIE,
        token,
        max_age=ADMIN_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return AdminLoginOut(username=body.username.strip())


@router.post("/logout")
async def admin_logout(request: Request, response: Response):
    clear_admin_session(request)
    response.delete_cookie(ADMIN_COOKIE)
    return {"ok": True}


@router.get("/me")
async def admin_me(_user: str = Depends(require_admin)):
    return {"ok": True, "username": _user}


@router.get("/users", response_model=AdminUsersOut)
async def admin_users(_user: str = Depends(require_admin)):
    data = await list_admin_users()
    return AdminUsersOut(**data)


@router.get("/stats")
async def admin_stats(
    _user: str = Depends(require_admin),
    days: int = Query(30, ge=1, le=365),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    factory = get_analytics_session_factory()
    async with factory() as session:
        return await get_admin_stats(session, date_from=date_from, date_to=date_to, days=days)


@router.get("/stats/timeseries")
async def admin_timeseries(
    _user: str = Depends(require_admin),
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
