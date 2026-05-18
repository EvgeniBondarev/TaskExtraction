from datetime import datetime

from pydantic import BaseModel, Field


class VisitIn(BaseModel):
    visitor_id: str = Field(..., min_length=8, max_length=64)
    session_id: str = Field(..., min_length=8, max_length=64)
    tenant_api_id: str | None = None
    utm_source: str | None = Field(None, max_length=128)
    utm_medium: str | None = Field(None, max_length=128)
    utm_campaign: str | None = Field(None, max_length=128)
    utm_content: str | None = Field(None, max_length=128)
    referrer: str | None = Field(None, max_length=2000)
    landing_path: str | None = Field(None, max_length=512)


class EventIn(BaseModel):
    event_type: str = Field(..., max_length=32)
    visitor_id: str | None = Field(None, max_length=64)
    tenant_api_id: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None


class AdminLoginIn(BaseModel):
    username: str
    password: str


class AdminLoginOut(BaseModel):
    ok: bool = True
    username: str


class StatsQuery(BaseModel):
    days: int = Field(30, ge=1, le=365)
    date_from: datetime | None = None
    date_to: datetime | None = None
