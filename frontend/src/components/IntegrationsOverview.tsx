import { useEffect, useState } from "react";
import { fetchJiraStatus, JiraStatus } from "../api/integrations/jira";
import { fetchGitHubStatus, GitHubStatus } from "../api/integrations/github";
import { fetchSlackStatus, SlackStatus } from "../api/integrations/slack";
import { fetchTrelloStatus, TrelloStatus } from "../api/integrations/trello";
import { IntegrationBrandIcon, IntegrationProvider } from "./IntegrationBrandIcon";
import { integrationState } from "./IntegrationCardHeader";
import { IntegrationsOverviewSkeleton } from "./PageSkeletons";

type Chip = {
  provider: IntegrationProvider;
  name: string;
  state: ReturnType<typeof integrationState> | "off";
  detail?: string;
  url?: string | null;
};

const STATE_LABELS: Record<string, string> = {
  idle: "Не настроено",
  ready: "Готово",
  active: "Активно",
  off: "Скоро",
};

export function IntegrationsOverview() {
  const [jira, setJira] = useState<JiraStatus | null>(null);
  const [trello, setTrello] = useState<TrelloStatus | null>(null);
  const [github, setGitHub] = useState<GitHubStatus | null>(null);
  const [slack, setSlack] = useState<SlackStatus | null>(null);

  useEffect(() => {
    Promise.all([fetchJiraStatus(), fetchTrelloStatus(), fetchGitHubStatus(), fetchSlackStatus()])
      .then(([j, t, g, s]) => {
        setJira(j);
        setTrello(t);
        setGitHub(g);
        setSlack(s);
      })
      .catch(() => {});
  }, []);

  const chips: Chip[] = [
    {
      provider: "jira",
      name: "Jira Cloud",
      state: jira ? integrationState(jira) : "idle",
      detail: jira?.is_configured
        ? `${jira.project_key || "—"}${jira.auto_push && jira.enabled ? " · авто" : ""}`
        : "Задачи в Jira",
      url: jira?.base_url || null,
    },
    {
      provider: "trello",
      name: "Trello",
      state: trello ? integrationState(trello) : "idle",
      detail: trello?.is_configured
        ? `${trello.list_name || trello.list_id || "—"}${trello.auto_push && trello.enabled ? " · авто" : ""}`
        : "Карточки на доске",
      url: "https://trello.com",
    },
    {
      provider: "github",
      name: "GitHub Issues",
      state: github ? integrationState(github) : "idle",
      detail: github?.is_configured
        ? `${github.owner}/${github.repo}${github.auto_push && github.enabled ? " · авто" : ""}`
        : "Issues в репозитории",
      url: github?.repo_url || null,
    },
    {
      provider: "slack",
      name: "Slack",
      state: slack ? integrationState(slack) : "idle",
      detail: slack?.is_configured
        ? `${slack.channel_name || "—"}${slack.auto_push && slack.enabled ? " · авто" : ""}`
        : "Уведомления в канал",
      url: slack?.workspace_url || "https://slack.com",
    },
    { provider: "youtrack", name: "YouTrack", state: "off", detail: "В разработке" },
  ];

  const activeCount = chips.filter((c) => c.state === "active").length;
  const loading = !jira && !trello && !github && !slack;

  if (loading) {
    return <IntegrationsOverviewSkeleton />;
  }

  return (
    <section className="integrations-overview">
      <div className="overview-summary">
        <span className="summary-pill">
          Подключено: <strong>{activeCount}</strong> / {chips.filter((c) => c.state !== "off").length}
        </span>
      </div>
      <div className="overview-grid">
        {chips.map((chip) => {
          const inner = (
            <>
              <span className="chip-icon-wrap">
                <IntegrationBrandIcon provider={chip.provider} size={22} />
              </span>
              <span className="chip-text">
                <strong>{chip.name}</strong>
                {chip.detail && <span className="chip-detail">{chip.detail}</span>}
              </span>
              <span className={`chip-status state-${chip.state}`}>{STATE_LABELS[chip.state]}</span>
            </>
          );
          if (chip.url && chip.state !== "off" && chip.state !== "idle") {
            return (
              <a
                key={chip.provider}
                className={`overview-chip provider-${chip.provider}`}
                href={chip.url}
                target="_blank"
                rel="noreferrer"
              >
                {inner}
              </a>
            );
          }
          return (
            <div key={chip.provider} className={`overview-chip provider-${chip.provider} static`}>
              {inner}
            </div>
          );
        })}
      </div>
      <style>{`
        .integrations-overview {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.1rem 1.15rem 1.15rem;
          border-color: rgba(99, 102, 241, 0.22);
          background: linear-gradient(160deg, rgba(99, 102, 241, 0.07) 0%, var(--surface) 55%);
        }
        .overview-summary {
          margin-bottom: 0.85rem;
        }
        .summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }
        .summary-pill strong { color: #e2e8f0; }
        .overview-grid {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }
        .overview-chip {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0.9rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s, transform 0.12s, box-shadow 0.15s;
        }
        .overview-chip:not(.static):hover {
          border-color: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .overview-chip.static { opacity: 0.65; }
        .chip-icon-wrap {
          flex-shrink: 0;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
        }
        .chip-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.12rem;
        }
        .chip-text strong {
          font-size: 0.9rem;
          font-weight: 600;
        }
        .chip-detail {
          font-size: 0.75rem;
          color: var(--muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chip-status {
          flex-shrink: 0;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.2rem 0.45rem;
          border-radius: 6px;
        }
        .chip-status.state-idle {
          background: rgba(100, 116, 139, 0.15);
          color: #94a3b8;
        }
        .chip-status.state-ready {
          background: rgba(251, 191, 36, 0.12);
          color: #fbbf24;
        }
        .chip-status.state-active {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        .chip-status.state-off {
          background: rgba(71, 85, 105, 0.2);
          color: #64748b;
        }
      `}</style>
    </section>
  );
}
