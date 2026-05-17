import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from telethon import events

from app.api import api_router
from app.config import get_settings
from app.services import telegram_auth
from app.telegram.ingest import get_monitored_chat_ids, handle_new_message, set_ws_broadcast

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_ws_clients: set[WebSocket] = set()
_monitored_ids: set[int] = set()
_handler_registered = False


async def _broadcast_ws(payload: dict):
    dead = []
    for ws in _ws_clients:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _ws_clients.discard(ws)


async def _refresh_monitored():
    global _monitored_ids
    ids = await get_monitored_chat_ids()
    _monitored_ids = set(ids)
    return _monitored_ids


async def _ingest_loop():
    global _handler_registered
    status = await telegram_auth.get_status()
    if not status.has_credentials:
        logger.warning("Telegram ingest disabled — configure credentials")
        return

    if not status.is_authorized:
        logger.warning("Telegram not authorized — complete login")
        return

    try:
        client = await telegram_auth.get_client()
        if not await client.is_user_authorized():
            logger.error("Telegram session invalid — re-login")
            return

        monitored = await _refresh_monitored()
        if not monitored:
            logger.warning("No monitored chats — select chats in the app")
        else:
            logger.info("Monitoring %s chat(s): %s", len(monitored), list(monitored))

        if not _handler_registered:

            @client.on(events.NewMessage())
            async def _on_message(event):
                chat_id = event.chat_id
                if _monitored_ids and chat_id not in _monitored_ids:
                    return
                try:
                    await handle_new_message(event.message)
                except Exception:
                    logger.exception("Failed to ingest message from chat %s", chat_id)

            _handler_registered = True
            logger.info("Ingest listener registered (all incoming messages filtered by monitored set)")

        while True:
            await asyncio.sleep(30)
            new_set = await _refresh_monitored()
            if new_set != monitored:
                monitored = new_set
                logger.info("Monitored chats updated: %s", list(monitored))
    except asyncio.CancelledError:
        logger.info("Ingest loop stopped")
        raise
    except Exception:
        logger.exception("Ingest loop error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    set_ws_broadcast(_broadcast_ws)
    ingest_task = asyncio.create_task(_ingest_loop())
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
    return {"status": "ok"}


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
