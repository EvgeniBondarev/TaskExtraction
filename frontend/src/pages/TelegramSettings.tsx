import { PuzzlePiece, SlidersHorizontal, TelegramLogo } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { IntegrationsSettingsHub } from "../components/integrations/IntegrationsSettingsHub";
import { PromptSettings } from "../components/PromptSettings";
import { TelegramSources } from "../components/TelegramSources";
import { useI18n } from "../i18n";

type SettingsTab = "telegram" | "prompts" | "integrations";

const TABS: { id: SettingsTab; icon: typeof TelegramLogo }[] = [
  { id: "telegram", icon: TelegramLogo },
  { id: "prompts", icon: SlidersHorizontal },
  { id: "integrations", icon: PuzzlePiece },
];

interface Props {
  onStatusChange?: () => void;
}

function tabFromHash(): SettingsTab {
  const h = window.location.hash.replace("#", "");
  if (h === "prompts" || h === "integrations" || h === "telegram") return h;
  return "telegram";
}

export function TelegramSettings({ onStatusChange }: Props) {
  const { messages } = useI18n();
  const s = messages.panel.settings;
  const [tab, setTab] = useState<SettingsTab>(tabFromHash);

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

  useEffect(() => {
    onStatusChange?.();
  }, [onStatusChange]);

  const current = s.sections[tab];
  const currentTab = TABS.find((item) => item.id === tab)!;
  const CurrentIcon = currentTab.icon;

  return (
    <main className="te-page te-settings">
      <header className="te-page__head te-settings__head">
        <div>
          <h1>{s.title}</h1>
          <p>{s.lead}</p>
        </div>
        <div className="te-settings__flow" role="navigation" aria-label={messages.settings.navAria}>
          {TABS.map(({ id, icon: Icon }, index) => (
            <button
              key={id}
              type="button"
              className={`te-settings__flow-step${tab === id ? " is-active" : ""}`}
              onClick={() => selectTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <span className="te-settings__flow-icon" aria-hidden>
                <Icon size={17} weight={tab === id ? "fill" : "regular"} />
                <b>{index + 1}</b>
              </span>
              <span>
                <strong>{s.sections[id].title}</strong>
                <small>{s.sections[id].hint}</small>
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="te-settings__layout">
        <nav className="te-settings__nav" aria-label={messages.settings.navAria}>
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`te-settings__tab${tab === id ? " is-active" : ""}`}
              onClick={() => selectTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={20} weight={tab === id ? "fill" : "regular"} aria-hidden />
              <span>
                <strong>{s.sections[id].title}</strong>
                <small>{s.sections[id].hint}</small>
              </span>
            </button>
          ))}
        </nav>

        <section className="te-settings__main" aria-label={current.title}>
          <header className="te-settings__section-head">
            <span className="te-settings__section-icon" aria-hidden><CurrentIcon size={20} weight="duotone" /></span>
            <div>
              <h2 className="te-settings__heading">{current.title}</h2>
              <p>{current.hint}</p>
            </div>
          </header>
          {tab === "telegram" && <TelegramSources />}
          {tab === "prompts" && <PromptSettings embedded />}
          {tab === "integrations" && <IntegrationsSettingsHub />}
        </section>
      </div>
    </main>
  );
}
