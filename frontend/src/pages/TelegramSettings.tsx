import { useEffect, useState } from "react";
import { IntegrationsSettingsHub } from "../components/integrations/IntegrationsSettingsHub";
import { LlmSettings } from "../components/LlmSettings";
import { PromptSettings } from "../components/PromptSettings";
import { TelegramSources } from "../components/TelegramSources";
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

  useEffect(() => {
    onStatusChange?.();
  }, [onStatusChange]);

  const tabs: SettingsTab[] = ["telegram", "llm", "prompts"];
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
              <TelegramSources />
            )}

            {tab === "integrations" && <IntegrationsSettingsHub />}

            {tab === "llm" && <LlmSettings embedded />}

            {tab === "prompts" && <PromptSettings embedded />}

          </div>
        </div>
      </div>
    </div>
  );
}
