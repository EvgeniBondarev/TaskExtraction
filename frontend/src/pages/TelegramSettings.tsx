import { useCallback, useEffect, useState } from "react";
import { fetchChatsStatus } from "../api/chats";
import { fetchTelegramStatus, TelegramStatus } from "../api/telegram";
import { SetupStepper } from "../components/SetupStepper";
import { getTelegramWizardStep, getTelegramWizardSteps } from "../utils/telegramWizardSteps";
import { ChatPicker } from "../components/ChatPicker";
import { IntegrationsSettingsHub } from "../components/integrations/IntegrationsSettingsHub";
import { LlmSettings } from "../components/LlmSettings";
import { PromptSettings } from "../components/PromptSettings";
import { TelegramSetupWizard } from "../components/TelegramSetupWizard";
import { useI18n } from "../i18n";
import "../styles/settings-page.css";

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

export function TelegramSettings({ onStatusChange }: Props) {
  const { messages: t } = useI18n();
  const s = t.settings;
  const [tab, setTab] = useState<SettingsTab>(tabFromHash);
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [hasMonitored, setHasMonitored] = useState(false);
  const [info, setInfo] = useState("");

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    setInfo("");
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
    const st = await fetchTelegramStatus();
    setStatus(st);
    if (st.is_authorized) {
      const cs = await fetchChatsStatus().catch(() => null);
      setHasMonitored(Boolean(cs?.has_monitored));
    } else {
      setHasMonitored(false);
    }
    onStatusChange?.();
  }, [onStatusChange]);

  const wizardStep = getTelegramWizardStep(status, hasMonitored, Boolean(status?.hosted_app));
  const wizardSteps = getTelegramWizardSteps(s);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const tabs: SettingsTab[] = ["telegram", "llm", "prompts"];
  if (status?.is_authorized) tabs.push("chats");
  tabs.push("integrations");

  const meta = { label: s.tabs[tab], lead: s.tabLeads[tab] };
  const bodyClass =
    tab === "integrations"
      ? "settings-body settings-body--integrations"
      : tab === "telegram"
        ? "settings-body settings-body--flat"
        : "settings-body";

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h2>{s.pageTitle}</h2>
        <p className="settings-page__lead">{s.pageLead}</p>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label={s.navAria}>
          {tabs.map((id) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              onClick={() => selectTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <span className="tab-icon" aria-hidden>
                {id === "telegram" && "✈"}
                {id === "llm" && "◇"}
                {id === "prompts" && "✎"}
                {id === "chats" && "💬"}
                {id === "integrations" && "⬡"}
              </span>
              {s.tabs[id]}
            </button>
          ))}
        </nav>

        <div className="settings-main">
          <header className="settings-main__head">
            <h3>{meta.label}</h3>
            <p>{meta.lead}</p>
          </header>

          {info && (
            <p className="settings-toast" role="status">
              {info}
            </p>
          )}

          <div className={bodyClass}>
            {tab === "telegram" && (
              <>
                <div className="settings-steps-inline" aria-label={s.telegramStepsAria}>
                  <SetupStepper
                    steps={wizardSteps}
                    currentIndex={wizardStep.current}
                    completedThrough={wizardStep.completed}
                  />
                </div>
                <TelegramSetupWizard
                  hideStepper
                  onStatusChange={reload}
                  onGoToChatsTab={() => selectTab("chats")}
                />
              </>
            )}

            {tab === "integrations" && <IntegrationsSettingsHub />}

            {tab === "llm" && <LlmSettings embedded />}

            {tab === "prompts" && <PromptSettings embedded />}

            {tab === "chats" && status?.is_authorized && (
              <div className="settings-chats">
                <ChatPicker
                  onSaved={() => {
                    setInfo(s.chatsUpdated);
                    reload();
                  }}
                  submitLabel={s.saveChats}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
