import { CaretDown } from "@phosphor-icons/react";
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
      <IntegrationsOverviewSkeleton />
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
    <div className="te-stack">
      <section className="te-panel te-panel--flat">
        <h3 className="te-panel__title">{intl.hubTitle}</h3>
        <ol className="te-steps te-steps--row">
          <li>{intl.hubStep1}</li>
          <li>{intl.hubStep2}</li>
          <li>{intl.hubStep3}</li>
        </ol>
        <p className="te-muted">
          {intl.activeCount} <strong>{activeCount}</strong> {intl.activeOf} {integrations.length}. {intl.manualSend}
        </p>
      </section>

      <div className="te-int-list" role="list">
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
            <article key={meta.id} role="listitem" className={`te-int te-int--${state}${isOpen ? " is-open" : ""}`}>
              <button type="button" className="te-int__trigger" aria-expanded={isOpen} onClick={() => toggle(meta.id)}>
                <IntegrationBrandIcon provider={meta.id} size={22} />
                <span className="te-int__text">
                  <strong>{meta.name}</strong>
                  <span>{summary || meta.tagline}</span>
                </span>
                <span className={`te-int__badge te-int__badge--${state}`}>
                  {badgeLabel(state, Boolean(auto && state === "active"))}
                </span>
                <CaretDown size={16} weight="bold" className="te-int__chevron" aria-hidden />
              </button>

              {isOpen && (
                <div className="te-int__panel int-form-scope">
                  {meta.id === "jira" && <JiraSettings embedded hideHeader onSaved={() => reload()} />}
                  {meta.id === "trello" && <TrelloSettings embedded hideHeader onSaved={() => reload()} />}
                  {meta.id === "github" && <GitHubSettings embedded hideHeader onSaved={() => reload()} />}
                  {meta.id === "slack" && <SlackSettings embedded hideHeader onSaved={() => reload()} />}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
