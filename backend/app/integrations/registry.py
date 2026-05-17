from app.integrations.github_adapter import GitHubAdapter
from app.integrations.jira_adapter import JiraAdapter
from app.integrations.slack_adapter import SlackAdapter
from app.integrations.trello_adapter import TrelloAdapter
from app.integrations.youtrack_adapter import YouTrackAdapter

ADAPTERS = {
    "github": GitHubAdapter(),
    "jira": JiraAdapter(),
    "trello": TrelloAdapter(),
    "slack": SlackAdapter(),
    "youtrack": YouTrackAdapter(),
}


def get_adapter(provider: str):
    adapter = ADAPTERS.get(provider)
    if not adapter:
        raise ValueError(f"Unknown provider: {provider}")
    return adapter
