import { useCallback, useEffect, useState } from "react";
import { fetchGitHubStatus, GitHubStatus } from "../api/integrations/github";
import { fetchJiraStatus, JiraStatus } from "../api/integrations/jira";
import { fetchSlackStatus, SlackStatus } from "../api/integrations/slack";
import { fetchTrelloStatus, TrelloStatus } from "../api/integrations/trello";
import { integrationState, IntegrationConnectionState } from "../components/IntegrationCardHeader";

export type IntegrationId = "jira" | "trello" | "github" | "slack";

export type IntegrationMeta = {
  id: IntegrationId;
  name: string;
  tagline: string;
};

export const INTEGRATIONS: IntegrationMeta[] = [
  { id: "jira", name: "Jira", tagline: "Тикеты в проекте Jira" },
  { id: "trello", name: "Trello", tagline: "Карточки на доске" },
  { id: "github", name: "GitHub", tagline: "Issues в репозитории" },
  { id: "slack", name: "Slack", tagline: "Уведомления в канал" },
];

export function getIntegrationSummary(
  id: IntegrationId,
  jira: JiraStatus | null,
  trello: TrelloStatus | null,
  github: GitHubStatus | null,
  slack: SlackStatus | null
): string {
  switch (id) {
    case "jira":
      if (!jira?.is_configured) return "Не подключено";
      return `${jira.project_key || "проект"}${jira.auto_push && jira.enabled ? " · авто" : ""}`;
    case "trello":
      if (!trello?.is_configured) return "Не подключено";
      return `${trello.board_name || "доска"} → ${trello.list_name || "список"}`;
    case "github":
      if (!github?.is_configured) return "Не подключено";
      return `${github.owner}/${github.repo}`;
    case "slack":
      if (!slack?.is_configured) return "Не подключено";
      return slack.channel_name || "канал не выбран";
    default:
      return "";
  }
}

export function getIntegrationState(
  id: IntegrationId,
  jira: JiraStatus | null,
  trello: TrelloStatus | null,
  github: GitHubStatus | null,
  slack: SlackStatus | null
): IntegrationConnectionState {
  switch (id) {
    case "jira":
      return jira ? integrationState(jira) : "idle";
    case "trello":
      return trello ? integrationState(trello) : "idle";
    case "github":
      return github ? integrationState(github) : "idle";
    case "slack":
      return slack ? integrationState(slack) : "idle";
    default:
      return "idle";
  }
}

export function useIntegrationsStatus() {
  const [jira, setJira] = useState<JiraStatus | null>(null);
  const [trello, setTrello] = useState<TrelloStatus | null>(null);
  const [github, setGitHub] = useState<GitHubStatus | null>(null);
  const [slack, setSlack] = useState<SlackStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [j, t, g, s] = await Promise.all([
      fetchJiraStatus(),
      fetchTrelloStatus(),
      fetchGitHubStatus(),
      fetchSlackStatus(),
    ]);
    setJira(j);
    setTrello(t);
    setGitHub(g);
    setSlack(s);
    setLoading(false);
    return { jira: j, trello: t, github: g, slack: s };
  }, []);

  useEffect(() => {
    reload().catch(() => setLoading(false));
  }, [reload]);

  const activeCount = INTEGRATIONS.filter(
    (i) => getIntegrationState(i.id, jira, trello, github, slack) === "active"
  ).length;

  return { jira, trello, github, slack, loading, reload, activeCount };
}
