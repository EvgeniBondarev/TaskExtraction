import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { useI18n } from "../../i18n";
import { ScrollReveal } from "./ScrollReveal";

const INTEGRATIONS = ["jira", "trello", "github", "slack"] as const;

export function LandingStats() {
  const { messages: t } = useI18n();
  const lp = t.landing;

  return (
    <ScrollReveal as="div" className="lp-stats" delay={80}>
      <div className="lp-stat">
        <strong className="lp-stat-word lp-stat-word--ai">AI</strong>
        <span>{lp.statsAiSub}</span>
      </div>
      <div className="lp-stat">
        <strong>∞</strong>
        <span>{lp.statsChats}</span>
      </div>
      <div className="lp-stat lp-stat--integrations">
        <p className="lp-stat-integrations-title">{lp.statsIntegrations}</p>
        <div className="lp-stat-icons">
          {INTEGRATIONS.map((p) => (
            <IntegrationBrandIcon key={p} provider={p} size={22} />
          ))}
        </div>
      </div>
      <div className="lp-stat">
        <strong>~5</strong>
        <span>{lp.statsStartSub}</span>
      </div>
    </ScrollReveal>
  );
}
