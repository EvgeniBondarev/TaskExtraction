from fastapi import APIRouter, Request

from app.analytics.service import record_event, record_visit
from app.schemas.analytics import EventIn, VisitIn
from app.tenancy import get_session_tenant

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    if request.client:
        return request.client.host
    return None


@router.post("/visit")
async def track_visit(body: VisitIn, request: Request):
    recorded = await record_visit(
        visitor_id=body.visitor_id,
        session_id=body.session_id,
        # Attribution to a workspace comes only from the signed server session,
        # never from a value a browser can forge.
        tenant_api_id=get_session_tenant(request),
        utm_source=body.utm_source,
        utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign,
        utm_content=body.utm_content,
        referrer=body.referrer or request.headers.get("referer"),
        landing_path=body.landing_path,
        ip_address=_client_ip(request),
        user_agent=(request.headers.get("user-agent") or "")[:500] or None,
    )
    return {"ok": True, "recorded": recorded}


@router.post("/event")
async def track_event(body: EventIn, request: Request):
    if body.event_type not in ("registration", "login", "setup_complete", "page_view"):
        return {"ok": False, "detail": "unknown event_type"}
    recorded = await record_event(
        event_type=body.event_type,
        visitor_id=body.visitor_id,
        tenant_api_id=get_session_tenant(request),
        utm_source=body.utm_source,
        utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign,
        utm_content=body.utm_content,
    )
    return {"ok": True, "recorded": recorded}
