import type { ReactNode } from "react";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { useI18n } from "../../i18n";
import { IconClassification, IconKanban, IconSync, IconTelegram } from "./FlowIcons";

const FLOW_ICONS: ReactNode[] = [
  <IconTelegram size={26} />,
  <IconClassification size={26} />,
  <IconKanban size={26} />,
  <IconSync size={26} />,
];

export function FlowDiagram() {
  const { messages: t } = useI18n();
  const flow = t.flow;

  return (
    <div className="lp-flow" aria-label={flow.aria}>
      <div className="lp-flow-track">
        {flow.steps.map((step, i) => (
          <div key={step.title} className="lp-flow-step">
            <div className="lp-flow-node">{FLOW_ICONS[i]}</div>
            <div className="lp-flow-text">
              <span className="lp-flow-step-label">
                {flow.stepLabel} {i + 1}
              </span>
              <strong>{step.title}</strong>
              <span>{step.sub}</span>
            </div>
            {i < flow.steps.length - 1 && <div className="lp-flow-connector" aria-hidden />}
          </div>
        ))}
      </div>
      <div className="lp-flow-integrations" aria-label={flow.integrations}>
        <IntegrationBrandIcon provider="jira" size={20} />
        <IntegrationBrandIcon provider="trello" size={20} />
        <IntegrationBrandIcon provider="github" size={20} />
        <IntegrationBrandIcon provider="slack" size={20} />
      </div>
    </div>
  );
}
