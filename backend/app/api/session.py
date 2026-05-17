from fastapi import APIRouter, Request

from app.tenancy import clear_session_tenant

router = APIRouter(prefix="/session", tags=["session"])


@router.post("/logout")
async def panel_logout(request: Request):
    """Сброс cookie-сессии панели. Данные tenant в БД и media не удаляются."""
    clear_session_tenant(request)
    return {"ok": True, "message": "Сессия панели завершена. Войдите снова со своими ключами Telegram API."}
