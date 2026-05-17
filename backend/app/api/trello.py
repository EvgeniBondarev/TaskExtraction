from fastapi import APIRouter, Body, HTTPException

from app.schemas.trello import (
    TrelloBoardOut,
    TrelloCredentialsIn,
    TrelloListOut,
    TrelloSettingsIn,
    TrelloStatusOut,
    TrelloTestIn,
    TrelloTestOut,
)
from app.services import trello_settings
from app.services.trello_client import TrelloClient, TrelloCredentials

router = APIRouter(prefix="/integrations/trello", tags=["integrations-trello"])


def _status_out(dto) -> TrelloStatusOut:
    return TrelloStatusOut(
        api_key=dto.api_key,
        has_token=dto.has_token,
        token_masked=dto.token_masked,
        board_id=dto.board_id,
        board_name=dto.board_name,
        list_id=dto.list_id,
        list_name=dto.list_name,
        enabled=dto.enabled,
        auto_push=dto.auto_push,
        include_media=dto.include_media,
        include_message_links=dto.include_message_links,
        is_configured=dto.is_configured,
        authorize_url=dto.authorize_url,
    )


def _client_from_test(body: TrelloTestIn) -> TrelloClient:
    if not body.api_key or not body.token:
        raise HTTPException(400, "Укажите API Key и Token")
    return TrelloClient(TrelloCredentials(api_key=body.api_key, token=body.token))


async def _client_from_saved() -> TrelloClient:
    creds = await trello_settings.get_trello_credentials()
    if not creds:
        raise HTTPException(400, "Сначала сохраните настройки Trello")
    api_key, token = creds
    return TrelloClient(TrelloCredentials(api_key=api_key, token=token))


async def _resolve_client(body: TrelloCredentialsIn | None) -> TrelloClient:
    if body and body.api_key and body.token:
        return TrelloClient(TrelloCredentials(api_key=body.api_key, token=body.token))
    return await _client_from_saved()


@router.get("/status", response_model=TrelloStatusOut)
async def trello_status():
    return _status_out(await trello_settings.get_trello_status())


@router.put("/settings", response_model=TrelloStatusOut)
async def update_trello_settings(body: TrelloSettingsIn):
    try:
        dto = await trello_settings.save_trello_settings(
            api_key=body.api_key,
            token=body.token,
            clear_token=body.clear_token,
            board_id=body.board_id,
            board_name=body.board_name,
            list_id=body.list_id,
            list_name=body.list_name,
            enabled=body.enabled,
            auto_push=body.auto_push,
            include_media=body.include_media,
            include_message_links=body.include_message_links,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        if "ENCRYPTION_KEY" in str(e):
            raise HTTPException(500, "ENCRYPTION_KEY не задан") from e
        raise HTTPException(500, "Не удалось сохранить настройки Trello") from e
    return _status_out(dto)


@router.post("/test", response_model=TrelloTestOut)
async def test_trello(body: TrelloTestIn):
    try:
        if body.api_key and body.token:
            client = _client_from_test(body)
        else:
            client = await _client_from_saved()
        me = await client.test_connection()
        name = me.get("fullName") or me.get("username")
        return TrelloTestOut(
            success=True,
            message="Подключение к Trello успешно",
            account_name=name,
        )
    except HTTPException:
        raise
    except ValueError as e:
        return TrelloTestOut(success=False, message=str(e))
    except Exception as e:
        return TrelloTestOut(success=False, message=f"Ошибка: {e}")


@router.post("/boards", response_model=list[TrelloBoardOut])
async def list_boards(body: TrelloCredentialsIn | None = Body(None)):
    try:
        client = await _resolve_client(body)
        boards = await client.list_boards()
        return [
            TrelloBoardOut(id=b.id, name=b.name, url=b.url, closed=b.closed) for b in boards
        ]
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.post("/boards/{board_id}/lists", response_model=list[TrelloListOut])
async def list_lists(board_id: str, body: TrelloCredentialsIn | None = Body(None)):
    try:
        client = await _resolve_client(body)
        lists = await client.list_lists(board_id)
        return [TrelloListOut(id=lst.id, name=lst.name, closed=lst.closed) for lst in lists]
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
