import { useCallback, useEffect, useState } from "react";
import { fetchChatsStatus } from "../api/chats";
import { fetchTelegramStatus, TelegramStatus } from "../api/telegram";
import { SetupStepper } from "../components/SetupStepper";
import { getTelegramWizardStep, TELEGRAM_WIZARD_STEPS } from "../utils/telegramWizardSteps";
import { ChatPicker } from "../components/ChatPicker";
import { JiraSettings } from "../components/JiraSettings";
import { GitHubSettings } from "../components/GitHubSettings";
import { SlackSettings } from "../components/SlackSettings";
import { IntegrationsOverview } from "../components/IntegrationsOverview";
import { TrelloSettings } from "../components/TrelloSettings";
import { LlmSettings } from "../components/LlmSettings";
import { PromptSettings } from "../components/PromptSettings";
import { SettingsPanel } from "../components/SettingsPanel";
import { TelegramSetupWizard } from "../components/TelegramSetupWizard";

type SettingsTab = "telegram" | "llm" | "prompts" | "chats" | "integrations";

interface Props {
  onStatusChange?: () => void;
}

function tabFromHash(): SettingsTab {
  const h = window.location.hash.replace("#", "");
  if (h === "llm" || h === "prompts" || h === "chats" || h === "integrations" || h === "telegram")
    return h;
  return "telegram";
}

const TAB_META: Record<SettingsTab, { label: string; icon: string }> = {
  telegram: { label: "Telegram", icon: "✈" },
  llm: { label: "OpenRouter", icon: "◇" },
  prompts: { label: "Промпты", icon: "✎" },
  chats: { label: "Чаты", icon: "💬" },
  integrations: { label: "Интеграции", icon: "⬡" },
};

export function TelegramSettings({ onStatusChange }: Props) {
  const [tab, setTab] = useState<SettingsTab>(tabFromHash);
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [hasMonitored, setHasMonitored] = useState(false);
  const [info, setInfo] = useState("");

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    const path = window.location.pathname;
    const newHash = next === "telegram" ? "" : `#${next}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState({}, "", `${path}${newHash}`);
    }
  };

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const reload = useCallback(async () => {
    const s = await fetchTelegramStatus();
    setStatus(s);
    if (s.is_authorized) {
      const cs = await fetchChatsStatus().catch(() => null);
      setHasMonitored(Boolean(cs?.has_monitored));
    } else {
      setHasMonitored(false);
    }
    onStatusChange?.();
  }, [onStatusChange]);

  const wizardStep = getTelegramWizardStep(status, hasMonitored);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const tabs: SettingsTab[] = ["telegram", "llm", "prompts"];
  if (status?.is_authorized) tabs.push("chats");
  tabs.push("integrations");

  return (
    <div className="settings-page">
      {tab === "telegram" && (
        <section className="settings-steps-top" aria-label="Этапы настройки Telegram">
          <SetupStepper
            steps={TELEGRAM_WIZARD_STEPS}
            currentIndex={wizardStep.current}
            completedThrough={wizardStep.completed}
          />
        </section>
      )}

      <header className="settings-header">
        <div>
          <h2>Настройки</h2>
          <p className="settings-lead">Подключение Telegram, AI и интеграции с трекерами</p>
        </div>
      </header>

      <nav className="settings-tabs" aria-label="Разделы настроек">
        {tabs.map((id) => {
          const meta = TAB_META[id];
          return (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              onClick={() => selectTab(id)}
            >
              <span className="tab-icon" aria-hidden>
                {meta.icon}
              </span>
              {meta.label}
            </button>
          );
        })}
      </nav>

      {info && <p className="settings-info">{info}</p>}

      {tab === "telegram" && (
        <TelegramSetupWizard
          hideStepper
          onStatusChange={reload}
          onGoToChatsTab={() => selectTab("chats")}
        />
      )}

      {tab === "integrations" && (
        <SettingsPanel
          className="settings-panel--integrations settings-panel--wide"
          icon="⬡"
          title="Интеграции"
          lead="Подключите трекеры — задачи из Telegram будут автоматически отправляться в Jira, Trello, GitHub или Slack."
        >
          <IntegrationsOverview />
          <JiraSettings embedded />
          <TrelloSettings embedded />
          <GitHubSettings embedded />
          <SlackSettings embedded />
        </SettingsPanel>
      )}

      {tab === "llm" && (
        <SettingsPanel
          className="settings-panel--llm"
          icon="◇"
          title="OpenRouter (LLM)"
          lead="Модель извлекает задачи из сообщений. Можно использовать встроенный ключ или свой."
        >
          <LlmSettings embedded />
        </SettingsPanel>
      )}

      {tab === "prompts" && (
        <div className="settings-section">
          <PromptSettings embedded />
        </div>
      )}

      {tab === "chats" && status?.is_authorized && (
        <section className="settings-card chats-card">
          <header className="chats-card-head">
            <div>
              <h3>Чаты для мониторинга</h3>
              <p className="card-hint">
                Сообщения из отмеченных чатов превращаются в задачи. Активные чаты показываются первыми.
              </p>
            </div>
          </header>
          <ChatPicker
            onSaved={() => {
              setInfo("Список чатов обновлён");
              reload();
            }}
            submitLabel="Сохранить чаты"
          />
        </section>
      )}

      <style>{`
        .settings-page {
          max-width: 720px;
          margin: 0 auto;
          padding-top: 1.25rem;
        }
        .settings-steps-top {
          margin-bottom: 1.5rem;
          padding: 1rem 1.1rem 1.15rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
        }
        .settings-steps-top .setup-stepper {
          margin-bottom: 0;
        }
        .settings-header {
          margin-bottom: 1.35rem;
        }
        .settings-header h2 {
          margin: 0 0 0.35rem;
          font-size: 1.45rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .settings-lead {
          margin: 0;
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.45;
        }
        .settings-tabs {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          padding: 0.35rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .settings-tabs button {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          border: none;
          color: var(--muted);
          padding: 0.5rem 0.85rem;
          border-radius: 9px;
          cursor: pointer;
          font: inherit;
          font-size: 0.85rem;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .settings-tabs button:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
        }
        .settings-tabs button.active {
          color: var(--text);
          background: var(--bg);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        }
        .tab-icon {
          font-size: 0.95rem;
          opacity: 0.85;
        }
        .settings-info {
          color: #60a5fa;
          font-size: 0.88rem;
          margin: -0.5rem 0 1rem;
        }
        .settings-panel--integrations .panel-body > section,
        .settings-panel--integrations .panel-body > div {
          margin: 0;
        }
        .settings-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.35rem 1.4rem;
        }
        .chats-card {
          padding: 1.25rem 1.35rem 1.4rem;
          border-color: rgba(59, 130, 246, 0.2);
          background: linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, var(--surface) 120px);
        }
        .chats-card-head { margin-bottom: 0.25rem; }
        .chats-card-head h3 { margin: 0 0 0.35rem; font-size: 1.05rem; }
        .chats-card .card-hint { margin: 0; }
        .settings-card h3 {
          margin: 0 0 0.4rem;
          font-size: 1rem;
        }
        .card-hint {
          margin: 0 0 1rem;
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}
