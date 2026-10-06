from fastapi import APIRouter

from app.api import (
    admin,
    analytics,
    attachments,
    chats,
    demo,
    github,
    google_auth,
    health,
    jira,
    llm,
    messages,
    owner_analytics,
    profiles,
    session,
    slack,
    tasks,
    telegram,
    trello,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
api_router.include_router(owner_analytics.router)
api_router.include_router(health.router)
api_router.include_router(demo.router)
api_router.include_router(session.router)
api_router.include_router(google_auth.router)
api_router.include_router(telegram.router)
api_router.include_router(llm.router)
api_router.include_router(jira.router)
api_router.include_router(trello.router)
api_router.include_router(github.router)
api_router.include_router(slack.router)
api_router.include_router(chats.router)
api_router.include_router(profiles.router)
api_router.include_router(attachments.router)
api_router.include_router(messages.router)
api_router.include_router(tasks.router)
