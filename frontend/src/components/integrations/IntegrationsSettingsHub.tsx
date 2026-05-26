import { useEffect, useState } from "react";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { IntegrationsOverviewSkeleton } from "../PageSkeletons";
import { GitHubSettings } from "../GitHubSettings";
import { JiraSettings } from "../JiraSettings";
import { SlackSettings } from "../SlackSettings";
import { TrelloSettings } from "../TrelloSettings";
import {
  getIntegrationState,
  getIntegrationSummary,
  getIntegrationsList,
  IntegrationId,
  useIntegrationsStatus,
} from "../../hooks/useIntegrationsStatus";
import { useI18n } from "../../i18n";
import "../../styles/integrations-hub.css";

export function IntegrationsSettingsHub() {
  const { messages: t } = useI18n();
  const intl = t.settings.integrations;
  const integrations = getIntegrationsList(intl);
  const { jira, trello, github, slack, loading, reload, activeCount } = useIntegrationsStatus();
  const [openId, setOpenId] = useState<IntegrationId | null>(null);

  useEffect(() => {
    if (loading) return;
    const firstIdle = integrations.find(
      (i) => getIntegrationState(i.id, jira, trello, github, slack) !== "active"
    );
    setOpenId((prev) => prev ?? firstIdle?.id ?? "jira");
  }, [loading, jira, trello, github, slack, integrations]);

  if (loading) {
    return (
      <div className="integrations-hub">
        <IntegrationsOverviewSkeleton />
      </div>
    );
  }

  const toggle = (id: IntegrationId) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const badgeLabel = (state: string, auto?: boolean) => {
    if (state === "active" && auto) return intl.states.activeAuto;
    return intl.states[state as keyof typeof intl.states] || state;
  };

  return (
    <div className="integrations-hub">
      <section className="integrations-hub-intro">
        <h3>{intl.hubTitle}</h3>
        <p>{intl.hubLead}</p>
        <ol className="integrations-hub-steps">
          <li>
            <strong>1</strong>
            <span>{intl.hubStep1}</span>
          </li>
          <li>
            <strong>2</strong>
            <span>{intl.hubStep2}</span>
          </li>
          <li>
            <strong>3</strong>
            <span>{intl.hubStep3}</span>
          </li>
        </ol>
      </section>

      <div className="integrations-hub-summary">
        <span className="integrations-hub-pill">
          {intl.activeCount} <strong>{activeCount}</strong> {intl.activeOf} {integrations.length}
        </span>
        <span className="integrations-hub-pill">{intl.manualSend}</span>
      </div>

      <div className="integrations-accordion" role="list">
        {integrations.map((meta) => {
          const state = getIntegrationState(meta.id, jira, trello, github, slack);
          const summary = getIntegrationSummary(meta.id, jira, trello, github, slack, intl);
          const isOpen = openId === meta.id;
          const auto =
            (meta.id === "jira" && jira?.auto_push) ||
            (meta.id === "trello" && trello?.auto_push) ||
            (meta.id === "github" && github?.auto_push) ||
            (meta.id === "slack" && slack?.auto_push);

          return (
            <article
              key={meta.id}
              role="listitem"
              className={`int-accordion-item state-${state}${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="int-accordion-trigger"
                aria-expanded={isOpen}
                onClick={() => toggle(meta.id)}
              >
                <span className="int-accordion-icon">
                  <IntegrationBrandIcon provider={meta.id} size={26} />
                </span>
                <span className="int-accordion-text">
                  <strong>{meta.name}</strong>
                  <span>{summary || meta.tagline}</span>
                </span>
                <span className={`int-accordion-badge state-${state}`}>
                  {badgeLabel(state, Boolean(auto && state === "active"))}
                </span>
                <span className="int-accordion-chevron" aria-hidden>
                  ▼
                </span>
              </button>

              {isOpen && (
                <div className="int-accordion-panel">
                  {meta.id === "jira" && (
                    <JiraSettings embedded hideHeader onSaved={() => reload()} />
                  )}
                  {meta.id === "trello" && (
                    <TrelloSettings embedded hideHeader onSaved={() => reload()} />
                  )}
                  {meta.id === "github" && (
                    <GitHubSettings embedded hideHeader onSaved={() => reload()} />
                  )}
                  {meta.id === "slack" && (
                    <SlackSettings embedded hideHeader onSaved={() => reload()} />
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
