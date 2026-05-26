import asyncio
import logging
import os
from contextlib import asynccontextmanager

from app.bootstrap import ensure_encryption_key

ensure_encryption_key()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request

from app.api import api_router
from app.config import get_settings

get_settings.cache_clear()
from app.telegram.ingest import set_ws_broadcast
from app.telegram.listener import run_ingest_loop
from app.tenancy import (
    bind_request_tenant,
    is_public_path,
    migrate_legacy_installation,
    migrate_all_tenant_databases,
    require_session_tenant,
    reset_current_tenant,
    session_secret,
    set_current_tenant,
)
from app.tenancy.http import tenant_from_session_cookie

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_ws_clients: dict[WebSocket, str] = {}


async def _broadcast_ws(payload: dict, tenant_key: str):
    dead: list[WebSocket] = []
    for ws, ws_tenant in _ws_clients.items():
        if ws_tenant != tenant_key:
            continue
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.pop(ws, None)


@asynccontextmanager
async def lifespan(app: FastAPI):
    migrated = migrate_legacy_installation()
    if migrated:
        logger.info("Legacy data migrated to tenant api_id=%s", migrated)
    migrate_all_tenant_databases()
    from app.analytics.db import init_analytics_db

    await init_analytics_db()
    set_ws_broadcast(_broadcast_ws)
    ingest_task = None
    if os.environ.get("TE_DISABLE_INGEST") == "1":
        logger.warning(
            "TE_DISABLE_INGEST=1 — фоновый приём сообщений из Telegram ВЫКЛЮЧЕН. "
            "Уберите переменную и перезапустите API."
        )
    else:
        ingest_task = asyncio.create_task(run_ingest_loop())
        from app.telegram.listener import wake_ingest

        wake_ingest()
    yield
    if ingest_task is not None:
        ingest_task.cancel()
        try:
            await ingest_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="TaskExtraction", version="0.2.0", lifespan=lifespan)
settings = get_settings()


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if is_public_path(path, request.method):
            tenant = bind_request_tenant(request)
            token = None
            if tenant:
                token = set_current_tenant(tenant)
            try:
                return await call_next(request)
            finally:
                if token is not None:
                    reset_current_tenant(token)

        from fastapi import HTTPException

        try:
            tenant = require_session_tenant(request)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

        token = set_current_tenant(tenant)
        try:
            return await call_next(request)
        finally:
            reset_current_tenant(token)


# Порядок: последний add_middleware выполняется первым на входящий запрос.
# SessionMiddleware должен быть снаружи, чтобы request.session был доступен в TenantIsolationMiddleware.
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=session_secret(),
    session_cookie="te_session",
    max_age=60 * 60 * 24 * 30,
    same_site="lax",
    https_only=False,
)


app.include_router(api_router)


@app.get("/health")
async def root_health():
    from app.services.hosted_telegram import is_hosted_mode
    from app.telegram.listener import get_ingest_status

    return {
        "status": "ok",
        "telegram_hosted": is_hosted_mode(),
        "ingest": get_ingest_status(),
    }


@app.websocket("/ws/messages")
async def ws_messages(websocket: WebSocket):
    tenant = tenant_from_session_cookie(websocket.cookies.get("te_session"))
    if not tenant:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    _ws_clients[websocket] = str(tenant)
    token = set_current_tenant(str(tenant))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _ws_clients.pop(websocket, None)
        reset_current_tenant(token)
