from collections.abc import AsyncGenerator

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.tenancy import (
    require_session_tenant,
    reset_current_tenant,
    set_current_tenant,
    tenant_session,
)


async def bind_tenant(request: Request) -> str:
    tenant = require_session_tenant(request)
    set_current_tenant(tenant)
    return tenant


async def get_session(
    _tenant: str = Depends(bind_tenant),
) -> AsyncGenerator[AsyncSession, None]:
    token = set_current_tenant(_tenant)
    try:
        async with tenant_session(_tenant) as session:
            yield session
    finally:
        reset_current_tenant(token)
