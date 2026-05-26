import { useCallback, useEffect, useState } from "react";
import {
  fetchTelegramCredentials,
  fetchTelegramStatus,
  logoutTelegram,
  resetTelegramAll,
  saveTelegramCredentials,
  TelegramStatus,
} from "../api/telegram";
import { fetchChatsStatus } from "../api/chats";
import { ChatPicker } from "./ChatPicker";
import { SettingsFormSkeleton } from "./PageSkeletons";
import { SetupStepper } from "./SetupStepper";
import { TelegramAuth } from "../pages/TelegramAuth";
import { useI18n } from "../i18n";
import {
  getTelegramWizardStep,
  getTelegramWizardSteps,
  getTelegramWizardStepsLegacy,
} from "../utils/telegramWizardSteps";
import { MY_TELEGRAM_APPS_URL } from "../api/telegram";
import { isHostedMode, useHostedApp } from "../hooks/useHostedApp";

interface Props {
  onStatusChange?: () => void;
  onGoToChatsTab?: () => void;
  /** Степпер рендерится на странице настроек сверху */
  hideStepper?: boolean;
}

export function TelegramSetupWizard({ onStatusChange, onGoToChatsTab, hideStepper }: Props) {
  const { messages: t } = useI18n();
  const w = t.settings.wizard;
  const c = t.settings.common;
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [hasMonitored, setHasMonitored] = useState(false);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [hashMasked, setHashMasked] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const reload = useCallback(async () => {
    const s = await fetchTelegramStatus();
    setStatus(s);
    if (s.is_authorized) {
      const cs = await fetchChatsStatus().catch(() => null);
      setHasMonitored(Boolean(cs?.has_monitored));
    } else {
      setHasMonitored(false);
    }
    const creds = await fetchTelegramCredentials();
    if (creds) {
      setApiId(String(creds.api_id));
      setHashMasked(creds.api_hash_masked);
      if (creds.app_title) setAppTitle(creds.app_title);
    }
    onStatusChange?.();
  }, [onStatusChange]);

  useEffect(() => {
    setInitialLoading(true);
    reload()
      .catch(() => setError(w.loadFailed))
      .finally(() => setInitialLoading(false));
  }, [reload]);

  const serverHosted = useHostedApp();
  const hostedApp = isHostedMode(serverHosted, status?.hosted_app);
  const wizardSteps = hostedApp
    ? getTelegramWizardSteps(t.settings)
    : getTelegramWizardStepsLegacy(t.settings);
  const { current, completed } = getTelegramWizardStep(status, hasMonitored, hostedApp);
  const showCredentialsPanel =
    serverHosted === false && !hostedApp && current === 0 && !status?.is_authorized;
  const showAuthPanel =
    !status?.is_authorized &&
    ((hostedApp && current === 0) || (!hostedApp && current === 1));
  const allDone = status?.is_authorized && hasMonitored;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiId.trim() || !apiHash.trim()) {
      setError(w.credentialsRequired);
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await saveTelegramCredentials({
        api_id: Number(apiId),
        api_hash: apiHash.trim(),
        app_title: appTitle || undefined,
      });
      setApiHash("");
      setInfo(w.credentialsSaved);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    try {
      await logoutTelegram();
      setInfo(w.loggedOut);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm(w.resetConfirm)) return;
    setLoading(true);
    try {
      await resetTelegramAll();
      setApiId("");
      setApiHash("");
      setInfo(w.resetDone);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || serverHosted === null) {
    return (
      <div className="tg-wizard">
        <SettingsFormSkeleton fields={3} />
      </div>
    );
  }

  return (
    <div className="tg-wizard">
      {!hideStepper && (
        <SetupStepper
          steps={wizardSteps}
          currentIndex={current}
          completedThrough={completed}
        />
      )}

      {allDone && status && (
        <div className="wizard-hero success">
          <div className="hero-icon" aria-hidden>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path
                d="M10 16.5L14 20.5L22 11.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="hero-body">
            <h3>{w.connectedTitle}</h3>
            <p>
              {status.first_name} {status.last_name}
              {status.username && (
                <>
                  {" "}
                  <span className="username">@{status.username}</span>
                </>
              )}
            </p>
            {hasMonitored && <span className="hero-badge">{w.chatsConfigured}</span>}
          </div>
          <button type="button" className="btn-ghost" onClick={handleLogout} disabled={loading}>
            {c.logout}
          </button>
        </div>
      )}

      {error && <p className="wizard-error">{error}</p>}
      {info && !error && <p className="wizard-info">{info}</p>}

      {showCredentialsPanel && (
        <section className="wizard-panel">
          <header className="panel-head">
            <span className="panel-step">
              {c.step} 1
            </span>
            <h3>{w.credentialsTitle}</h3>
            <p>{w.credentialsLead}</p>
          </header>
          <form onSubmit={handleSaveCredentials} className="wizard-form">
            <ol className="wizard-mini-steps">
              <li>
                <a href={MY_TELEGRAM_APPS_URL} target="_blank" rel="noreferrer">
                  my.telegram.org/apps
                </a>
              </li>
              <li>{w.credentialsCopyHint}</li>
            </ol>
            <label>
              {w.appApiId}
              <input
                type="number"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                required
              />
            </label>
            <label>
              {w.newApiHash}
              <input
                type="password"
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                placeholder={w.newApiHashPlaceholder}
                required
              />
            </label>
            <label>
              App title <span className="opt">{c.optional}</span>
              <input value={appTitle} onChange={(e) => setAppTitle(e.target.value)} />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? c.saving : w.credentialsNext}
            </button>
          </form>
        </section>
      )}

      {showAuthPanel && (
        <section className="wizard-panel wizard-panel--auth">
          <TelegramAuth
            embedded
            wizard
            onComplete={() => {
              setInfo(w.loginDone);
              reload();
            }}
          />
        </section>
      )}

      {((status?.hosted_app ? current === 1 : current === 2) &&
        status?.is_authorized &&
        !hasMonitored) && (
        <section className="wizard-panel">
          <header className="panel-head">
            <span className="panel-step">{c.step} 3</span>
            <h3>{w.selectChatsTitle}</h3>
            <p>{w.selectChatsLead}</p>
          </header>
          <ChatPicker
            onSaved={() => {
              setInfo(w.chatsSaved);
              reload();
            }}
            submitLabel={w.saveAndFinish}
          />
          {onGoToChatsTab && (
            <button type="button" className="btn-link" onClick={onGoToChatsTab}>
              {w.openChatsTab}
            </button>
          )}
        </section>
      )}

      {current === 3 && status?.is_authorized && !allDone && (
        <section className="wizard-panel done-panel">
          <p className="done-text">{w.doneText}</p>
        </section>
      )}

      {status?.has_credentials && !status.hosted_app && (
        <details
          className="wizard-advanced"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary>{w.advancedSummary}</summary>
          <div className="advanced-inner">
            {hashMasked && (
              <p className="hint">
                {w.currentHash} {hashMasked}
              </p>
            )}
            <form onSubmit={handleSaveCredentials} className="wizard-form compact">
              <label>
                {w.appApiId}
                <input type="number" value={apiId} onChange={(e) => setApiId(e.target.value)} />
              </label>
              <label>
                {w.newApiHash}
                <input
                  type="password"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder={w.newApiHashPlaceholder}
                />
              </label>
              <button type="submit" className="btn-secondary" disabled={loading}>
                {w.updateKeys}
              </button>
            </form>
            <button type="button" className="btn-danger" onClick={handleResetAll} disabled={loading}>
              {w.deleteAllTelegram}
            </button>
          </div>
        </details>
      )}

      <style>{`
        .tg-wizard .wizard-mini-steps {
          margin: 0 0 1rem;
          padding-left: 1.2rem;
          font-size: 0.84rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .tg-wizard .wizard-mini-steps a {
          color: #93c5fd;
        }
        .tg-wizard .wizard-form label {
          display: block;
          margin-bottom: 0.85rem;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .tg-wizard .wizard-form input {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 10px;
          padding: 0.6rem 0.7rem;
          font: inherit;
          box-sizing: border-box;
        }
        .tg-wizard .wizard-form input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .tg-wizard .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          color: #fff;
          padding: 0.7rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          margin-top: 0.25rem;
          cursor: pointer;
          font: inherit;
        }
        .tg-wizard .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .tg-wizard .btn-secondary {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font: inherit;
        }
        .tg-wizard .btn-danger {
          width: 100%;
          margin-top: 0.75rem;
          background: transparent;
          border: 1px solid rgba(220, 38, 38, 0.5);
          color: #f87171;
          padding: 0.55rem;
          border-radius: 8px;
          cursor: pointer;
          font: inherit;
        }
        .tg-wizard .btn-link {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 0.85rem;
          margin-top: 0.75rem;
          padding: 0;
          cursor: pointer;
          font: inherit;
        }
        .tg-wizard .done-panel { text-align: center; padding: 1.5rem 1rem; }
        .tg-wizard .done-text { margin: 0; color: var(--muted); font-size: 0.92rem; }
        .tg-wizard .advanced-inner .hint { font-size: 0.8rem; color: var(--muted); margin: 0 0 0.75rem; }
        .tg-wizard .wizard-form.compact { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
