import { ArrowLeft, Eye, GearSix, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { deleteGitHubSettings, saveGitHubSettings } from "../../api/integrations/github";
import { deleteJiraSettings, saveJiraSettings } from "../../api/integrations/jira";
import { deleteSlackSettings, saveSlackSettings } from "../../api/integrations/slack";
import { deleteTrelloSettings, saveTrelloSettings } from "../../api/integrations/trello";
import {
  getIntegrationState,
  getIntegrationSummary,
  getIntegrationsList,
  IntegrationId,
  useIntegrationsStatus,
} from "../../hooks/useIntegrationsStatus";
import { useI18n } from "../../i18n";
import { ConfirmDialog } from "../ConfirmDialog";
import { GitHubSettings } from "../GitHubSettings";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { JiraSettings } from "../JiraSettings";
import { IntegrationsOverviewSkeleton } from "../PageSkeletons";
import { SlackSettings } from "../SlackSettings";
import { TrelloSettings } from "../TrelloSettings";

const SAVE: Record<IntegrationId, (body: Record<string, unknown>) => Promise<unknown>> = {
  jira: saveJiraSettings,
  trello: saveTrelloSettings,
  github: saveGitHubSettings,
  slack: saveSlackSettings,
};

const REMOVE: Record<IntegrationId, () => Promise<unknown>> = {
  jira: deleteJiraSettings,
  trello: deleteTrelloSettings,
  github: deleteGitHubSettings,
  slack: deleteSlackSettings,
};

export function IntegrationsSettingsHub() {
  const { messages: t } = useI18n();
  const intl = t.settings.integrations;
  const ui = t.panel.settings.integrations;
  const integrations = getIntegrationsList(intl);
  const { jira, trello, github, slack, loading, reload } = useIntegrationsStatus();
  const [openId, setOpenId] = useState<IntegrationId | null>(null);
  const [confirmId, setConfirmId] = useState<IntegrationId | null>(null);
  const [busyId, setBusyId] = useState<IntegrationId | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (loading) return <IntegrationsOverviewSkeleton />;

  const statuses = { jira, trello, github, slack };
  const nameOf = (id: IntegrationId) => integrations.find((i) => i.id === id)?.name ?? id;

  const toggleEnabled = async (id: IntegrationId, enabled: boolean) => {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      await SAVE[id]({ enabled });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : ui.error);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: IntegrationId) => {
    setBusyId(id);
    setError("");
    try {
      await REMOVE[id]();
      await reload();
      setNotice(ui.deleted.replace("{name}", nameOf(id)));
      setConfirmId(null);
      setOpenId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : ui.error);
    } finally {
      setBusyId(null);
    }
  };

  const confirm = confirmId && (
    <ConfirmDialog
      title={ui.deleteTitle.replace("{name}", nameOf(confirmId))}
      text={ui.deleteText}
      confirmLabel={ui.deleteConfirm}
      cancelLabel={ui.cancel}
      danger
      busy={busyId === confirmId}
      onConfirm={() => void remove(confirmId)}
      onCancel={() => setConfirmId(null)}
    />
  );

  if (openId) {
    const meta = integrations.find((i) => i.id === openId)!;
    const state = getIntegrationState(openId, jira, trello, github, slack);
    return (
      <div className="te-stack">
        {confirm}
        <button type="button" className="te-btn te-btn--quiet te-btn--sm te-back" onClick={() => setOpenId(null)}>
          <ArrowLeft size={16} aria-hidden />
          {ui.back}
        </button>

        <section className="te-panel te-int-detail">
          <header className="te-int-detail__head">
            <IntegrationBrandIcon provider={openId} size={26} />
            <div>
              <h3>{meta.name}</h3>
              <p>{meta.tagline}</p>
            </div>
            <span className={`te-int__badge te-int__badge--${state}`}>{ui.states[state as keyof typeof ui.states] ?? state}</span>
            {state !== "idle" && (
              <button type="button" className="te-btn te-btn--danger-ghost te-btn--sm" onClick={() => setConfirmId(openId)}>
                <Trash size={15} aria-hidden />
                {ui.remove}
              </button>
            )}
          </header>
          <div className="te-example">
            <Eye size={18} aria-hidden />
            <div>
              <strong>{ui.example}</strong>
              <p>{ui.examples[openId]}</p>
            </div>
          </div>
        </section>

        {error && <p className="te-alert te-alert--error">{error}</p>}

        <div className="te-panel int-form-scope">
          {openId === "jira" && <JiraSettings embedded hideHeader onSaved={() => reload()} />}
          {openId === "trello" && <TrelloSettings embedded hideHeader onSaved={() => reload()} />}
          {openId === "github" && <GitHubSettings embedded hideHeader onSaved={() => reload()} />}
          {openId === "slack" && <SlackSettings embedded hideHeader onSaved={() => reload()} />}
        </div>
      </div>
    );
  }

  return (
    <div className="te-stack">
      {confirm}
      <p className="te-settings__lead">{ui.lead}</p>
      {error && <p className="te-alert te-alert--error">{error}</p>}
      {notice && !error && (
        <p className="te-alert te-alert--ok" role="status">
          {notice}
        </p>
      )}

      <div className="te-int-grid">
        {integrations.map((meta) => {
          const status = statuses[meta.id];
          const state = getIntegrationState(meta.id, jira, trello, github, slack);
          const connected = state !== "idle";
          const summary = getIntegrationSummary(meta.id, jira, trello, github, slack, intl);
          const enabled = Boolean(status?.enabled);
          const auto = Boolean(status?.auto_push);
          const busy = busyId === meta.id;

          return (
            <article key={meta.id} className={`te-int-tile te-int-tile--${state}`}>
              <header className="te-int-tile__head">
                <IntegrationBrandIcon provider={meta.id} size={24} />
                <div className="te-int-tile__title">
                  <strong>{meta.name}</strong>
                  <span>{connected ? summary : meta.tagline}</span>
                </div>
                <span className={`te-int__badge te-int__badge--${state}`}>
                  {ui.states[state as keyof typeof ui.states] ?? state}
                </span>
              </header>

              {connected ? (
                <>
                  <p className="te-int-tile__mode">{enabled && auto ? ui.auto : ui.manual}</p>
                  <footer className="te-int-tile__foot">
                    <label className="te-switch te-switch--sm">
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={busy}
                        onChange={(e) => void toggleEnabled(meta.id, e.target.checked)}
                      />
                      <span className="te-switch__track" aria-hidden />
                      <span>{ui.enabled}</span>
                    </label>
                    <span className="te-int-tile__actions">
                      <button type="button" className="te-btn te-btn--ghost te-btn--sm" onClick={() => setOpenId(meta.id)}>
                        <GearSix size={15} aria-hidden />
                        {ui.configure}
                      </button>
                      <button
                        type="button"
                        className="te-icon-btn te-icon-btn--danger"
                        onClick={() => setConfirmId(meta.id)}
                        disabled={busy}
                        title={ui.remove}
                        aria-label={`${ui.remove}: ${meta.name}`}
                      >
                        <Trash size={16} />
                      </button>
                    </span>
                  </footer>
                </>
              ) : (
                <>
                  <p className="te-int-tile__mode">{ui.examples[meta.id]}</p>
                  <footer className="te-int-tile__foot">
                    <button type="button" className="te-btn te-btn--primary te-btn--sm" onClick={() => setOpenId(meta.id)}>
                      <Plus size={14} weight="bold" aria-hidden />
                      {ui.connect}
                    </button>
                  </footer>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
