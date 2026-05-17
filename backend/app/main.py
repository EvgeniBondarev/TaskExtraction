import asyncio
import logging
from contextlib import asynccontextmanager

from app.bootstrap import ensure_encryption_key

ensure_encryption_key()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import get_settings
from app.telegram.ingest import set_ws_broadcast
from app.telegram.listener import run_ingest_loop

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_ws_clients: set[WebSocket] = set()


async def _broadcast_ws(payload: dict):
    dead = []
    for ws in _ws_clients:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.discard(ws)


@asynccontextmanager
async def lifespan(app: FastAPI):
    set_ws_broadcast(_broadcast_ws)
    ingest_task = asyncio.create_task(run_ingest_loop())
    yield
    ingest_task.cancel()
    try:
        await ingest_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="TaskExtraction", version="0.1.0", lifespan=lifespan)
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def root_health():
    from app.telegram.listener import get_ingest_status

    return {"status": "ok", "ingest": get_ingest_status()}


@app.websocket("/ws/messages")
async def ws_messages(websocket: WebSocket):
    await websocket.accept()
    _ws_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        _ws_clients.discard(websocket)
