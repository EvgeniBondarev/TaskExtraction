import { useCallback, useEffect, useState } from "react";
import { fetchGitHubStatus, GitHubStatus } from "../api/integrations/github";
import { fetchJiraStatus, JiraStatus } from "../api/integrations/jira";
import { fetchSlackStatus, SlackStatus } from "../api/integrations/slack";
import { fetchTrelloStatus, TrelloStatus } from "../api/integrations/trello";
import { integrationState, IntegrationConnectionState } from "../components/IntegrationCardHeader";
import type { SettingsMessages } from "../i18n/types";

export const INTEGRATIONS_PROMPT_PENDING_KEY = "te_integrations_prompt_pending";
export const INTEGRATIONS_PROMPT_DISMISSED_KEY = "te_integrations_prompt_dismissed";

type IntegrationStatus = JiraStatus | TrelloStatus | GitHubStatus | SlackStatus | null;

export function hasAnyIntegrationConfigured(
  jira: IntegrationStatus,
  trello: IntegrationStatus,
  github: IntegrationStatus,
  slack: IntegrationStatus
): boolean {
  return [jira, trello, github, slack].some((s) => Boolean(s?.is_configured || s?.has_token));
}

export function markIntegrationsPromptPending(): void {
  try {
    sessionStorage.setItem(INTEGRATIONS_PROMPT_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function dismissIntegrationsPrompt(): void {
  try {
    localStorage.setItem(INTEGRATIONS_PROMPT_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isIntegrationsPromptDismissed(): boolean {
  try {
    return localStorage.getItem(INTEGRATIONS_PROMPT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function consumeIntegrationsPromptPending(): boolean {
  try {
    const pending = sessionStorage.getItem(INTEGRATIONS_PROMPT_PENDING_KEY) === "1";
    if (pending) sessionStorage.removeItem(INTEGRATIONS_PROMPT_PENDING_KEY);
    return pending;
  } catch {
    return false;
  }
}

export type IntegrationId = "jira" | "trello" | "github" | "slack";

export type IntegrationMeta = {
  id: IntegrationId;
  name: string;
  tagline: string;
};

export function getIntegrationsList(intl: SettingsMessages["integrations"]): IntegrationMeta[] {
  return [
    { id: "jira", name: "Jira", tagline: intl.taglines.jira },
    { id: "trello", name: "Trello", tagline: intl.taglines.trello },
    { id: "github", name: "GitHub", tagline: intl.taglines.github },
    { id: "slack", name: "Slack", tagline: intl.taglines.slack },
  ];
}

/** @deprecated use getIntegrationsList */
export const INTEGRATIONS: IntegrationMeta[] = [];

export function getIntegrationSummary(
  id: IntegrationId,
  jira: JiraStatus | null,
  trello: TrelloStatus | null,
  github: GitHubStatus | null,
  slack: SlackStatus | null,
  intl: SettingsMessages["integrations"]
): string {
  switch (id) {
    case "jira":
      if (!jira?.is_configured) return intl.notConnected;
      return `${jira.project_key || intl.project}${jira.auto_push && jira.enabled ? intl.autoSuffix : ""}`;
    case "trello":
      if (!trello?.is_configured) return intl.notConnected;
      return `${trello.board_name || intl.board} → ${trello.list_name || intl.list}`;
    case "github":
      if (!github?.is_configured) return intl.notConnected;
      return `${github.owner}/${github.repo}`;
    case "slack":
      if (!slack?.is_configured) return intl.notConnected;
      return slack.channel_name || intl.channelNone;
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

  const activeCount = (["jira", "trello", "github", "slack"] as const).filter(
    (i) => getIntegrationState(i, jira, trello, github, slack) === "active"
  ).length;

  return { jira, trello, github, slack, loading, reload, activeCount };
}
