import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { ScrollReveal } from "./ScrollReveal";

const INTEGRATIONS = ["jira", "trello", "github", "slack"] as const;

export function LandingStats() {
  return (
    <ScrollReveal as="div" className="lp-stats" delay={80}>
      <div className="lp-stat">
        <strong className="lp-stat-word lp-stat-word--ai">AI</strong>
        <span>автораспознавание задач без тегов и спецслов</span>
      </div>
      <div className="lp-stat">
        <strong>∞</strong>
        <span>чатов Telegram</span>
      </div>
      <div className="lp-stat lp-stat--integrations">
        <p className="lp-stat-integrations-title">Интеграции с внешними системами</p>
        <div className="lp-stat-icons">
          {INTEGRATIONS.map((p) => (
            <IntegrationBrandIcon key={p} provider={p} size={22} />
          ))}
        </div>
      </div>
      <div className="lp-stat">
        <strong>~5</strong>
        <span>мин до старта</span>
      </div>
    </ScrollReveal>
  );
}
