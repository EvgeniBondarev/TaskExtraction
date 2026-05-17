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
  INTEGRATIONS,
  IntegrationId,
  useIntegrationsStatus,
} from "../../hooks/useIntegrationsStatus";
import "../../styles/integrations-hub.css";

const STATE_LABELS: Record<string, string> = {
  idle: "Не настроено",
  ready: "Выключено",
  active: "Работает",
};

function badgeLabel(state: string, auto?: boolean) {
  if (state === "active" && auto) return "Работает · авто";
  return STATE_LABELS[state] || state;
}

export function IntegrationsSettingsHub() {
  const { jira, trello, github, slack, loading, reload, activeCount } = useIntegrationsStatus();
  const [openId, setOpenId] = useState<IntegrationId | null>(null);

  useEffect(() => {
    if (loading) return;
    const firstIdle = INTEGRATIONS.find(
      (i) => getIntegrationState(i.id, jira, trello, github, slack) !== "active"
    );
    setOpenId((prev) => prev ?? firstIdle?.id ?? "jira");
  }, [loading, jira, trello, github, slack]);

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

  return (
    <div className="integrations-hub">
      <section className="integrations-hub-intro">
        <h3>Как это работает</h3>
        <p>
          Когда в Telegram появляется новая задача, она может автоматически уйти в выбранный сервис.
          Настройте каждый сервис по шагам — откройте карточку ниже.
        </p>
        <ol className="integrations-hub-steps">
          <li>
            <strong>1</strong>
            <span>Введите ключи и нажмите «Проверить подключение»</span>
          </li>
          <li>
            <strong>2</strong>
            <span>Выберите проект, доску или канал — куда попадут задачи</span>
          </li>
          <li>
            <strong>3</strong>
            <span>Включите интеграцию и при необходимости «Автоматически при новой задаче»</span>
          </li>
        </ol>
      </section>

      <div className="integrations-hub-summary">
        <span className="integrations-hub-pill">
          Активно: <strong>{activeCount}</strong> из {INTEGRATIONS.length}
        </span>
        <span className="integrations-hub-pill">
          Ручная отправка: из карточки задачи в канбане
        </span>
      </div>

      <div className="integrations-accordion" role="list">
        {INTEGRATIONS.map((meta) => {
          const state = getIntegrationState(meta.id, jira, trello, github, slack);
          const summary = getIntegrationSummary(meta.id, jira, trello, github, slack);
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
