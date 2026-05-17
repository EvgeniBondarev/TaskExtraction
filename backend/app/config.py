from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    telegram_api_id: int = 0
    telegram_api_hash: str = ""
    telegram_chat_id: int = 0
    telegram_session_path: str = "/data/session"
    encryption_key: str = ""

    database_url: str = "sqlite+aiosqlite:///./data/taskextraction.db"

    llm_confidence_threshold: float = 0.7

    assignees: str = "Оператор,Разработчик"
    cors_origins: str = "http://localhost:5173"
    media_dir: str = "/data/media"
    public_api_url: str = "http://localhost:8000"

    github_token: str = ""
    github_repo: str = ""

    jira_base_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    jira_project_key: str = ""

    youtrack_base_url: str = ""
    youtrack_token: str = ""
    youtrack_project_id: str = ""

    @property
    def assignee_list(self) -> list[str]:
        return [a.strip() for a in self.assignees.split(",") if a.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
