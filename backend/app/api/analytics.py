from fastapi import APIRouter, Request

from app.analytics.service import record_event, record_visit
from app.schemas.analytics import EventIn, VisitIn

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
    await record_visit(
        visitor_id=body.visitor_id,
        session_id=body.session_id,
        tenant_api_id=body.tenant_api_id,
        utm_source=body.utm_source,
        utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign,
        utm_content=body.utm_content,
        referrer=body.referrer or request.headers.get("referer"),
        landing_path=body.landing_path,
        ip_address=_client_ip(request),
        user_agent=(request.headers.get("user-agent") or "")[:500] or None,
    )
    return {"ok": True}


@router.post("/event")
async def track_event(body: EventIn):
    if body.event_type not in ("registration", "login", "setup_complete", "page_view"):
        return {"ok": False, "detail": "unknown event_type"}
    await record_event(
        event_type=body.event_type,
        visitor_id=body.visitor_id,
        tenant_api_id=body.tenant_api_id,
        utm_source=body.utm_source,
        utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign,
        utm_content=body.utm_content,
    )
    return {"ok": True}
