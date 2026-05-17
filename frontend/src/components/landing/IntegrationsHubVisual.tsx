import { IntegrationBrandIcon, IntegrationProvider } from "../IntegrationBrandIcon";

/** Схема: центр TaskExtraction → четыре внешние системы (hub-and-spoke) */
export function IntegrationsHubVisual() {
  return (
    <div className="lp-int-diagram" aria-hidden>
      <svg className="lp-int-diagram-svg" viewBox="0 0 400 320" fill="none">
        <defs>
          <linearGradient id="lp-int-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <line x1="200" y1="160" x2="200" y2="52" stroke="url(#lp-int-line)" strokeWidth="1.5" strokeDasharray="5 4" />
        <line x1="200" y1="160" x2="72" y2="160" stroke="url(#lp-int-line)" strokeWidth="1.5" strokeDasharray="5 4" />
        <line x1="200" y1="160" x2="328" y2="160" stroke="url(#lp-int-line)" strokeWidth="1.5" strokeDasharray="5 4" />
        <line x1="200" y1="160" x2="200" y2="268" stroke="url(#lp-int-line)" strokeWidth="1.5" strokeDasharray="5 4" />
        <circle cx="200" cy="160" r="4" fill="#3b82f6" opacity="0.6" />
      </svg>

      <div className="lp-int-diagram-grid">
        <div className="lp-int-diagram-node lp-int-diagram-node--jira">
          <IntegrationNode provider="jira" name="Jira Cloud" desc="Issues в проекте" />
        </div>
        <div className="lp-int-diagram-node lp-int-diagram-node--trello">
          <IntegrationNode provider="trello" name="Trello" desc="Карточки на доске" />
        </div>
        <div className="lp-int-diagram-core">
          <AppLogoMark />
          <span className="lp-int-diagram-core-title">TaskExtraction</span>
          <span className="lp-int-diagram-core-sub">auto-push</span>
        </div>
        <div className="lp-int-diagram-node lp-int-diagram-node--github">
          <IntegrationNode provider="github" name="GitHub" desc="Issues в репо" />
        </div>
        <div className="lp-int-diagram-node lp-int-diagram-node--slack">
          <IntegrationNode provider="slack" name="Slack" desc="Уведомления" />
        </div>
      </div>
    </div>
  );
}

function IntegrationNode({
  provider,
  name,
  desc,
}: {
  provider: IntegrationProvider;
  name: string;
  desc: string;
}) {
  return (
    <div className="lp-int-diagram-card">
      <IntegrationBrandIcon provider={provider} size={24} />
      <div className="lp-int-diagram-card-text">
        <strong>{name}</strong>
        <span>{desc}</span>
      </div>
    </div>
  );
}

function AppLogoMark() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <path d="M9 10h10M9 14h7M9 18h9" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.95" />
      <path d="M21 9l3 3-6 6h-3v-3l6-6z" fill="#93c5fd" />
    </svg>
  );
}
