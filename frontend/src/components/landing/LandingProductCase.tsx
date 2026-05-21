import type { ReactNode } from "react";
import { useRef } from "react";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { useI18n } from "../../i18n";
import { CaseFlowPanel, useCaseScrollPhase } from "./CaseScrollFlow";
import { FeedIllustration, KanbanIllustration, ShopChatIllustration } from "./LandingIllustrations";
import { ScrollReveal } from "./ScrollReveal";

const CASE_VISUALS: (ReactNode | undefined)[] = [
  <ShopChatIllustration />,
  <KanbanIllustration />,
  <FeedIllustration />,
  (
    <div className="lp-case-integrations" aria-hidden>
      <IntegrationBrandIcon provider="jira" size={44} />
      <IntegrationBrandIcon provider="trello" size={44} />
      <IntegrationBrandIcon provider="github" size={44} />
      <IntegrationBrandIcon provider="slack" size={44} />
    </div>
  ),
];

/** Индекс шага таймлайна, подсвеченного при данной фазе анимации */
function timelinePhaseIndex(phase: number, stepCount: number) {
  if (phase <= 0) return 0;
  if (phase >= 4) return stepCount - 1;
  return Math.min(phase - 1, stepCount - 1);
}

export function LandingProductCase() {
  const { messages: t } = useI18n();
  const lp = t.landing;
  const steps = t.case.steps;
  const scrollRef = useRef<HTMLDivElement>(null);
  const phase = useCaseScrollPhase(scrollRef);
  const activeStep = timelinePhaseIndex(phase, steps.length);

  return (
    <div className="lp-case">
      <ScrollReveal className="lp-case-intro lp-section-head--center">
        <span className="lp-badge">{lp.caseBadge}</span>
        <h2>{lp.caseTitle}</h2>
        <p className="lp-section-lead">{lp.caseLead}</p>
      </ScrollReveal>

      <div ref={scrollRef} className="lp-case-scroll">
        <div className="lp-case-layout">
          <ol className="lp-case-timeline">
            {steps.map((step, index) => (
              <li
                key={step.num}
                className={`lp-case-timeline-item${index === activeStep ? " lp-case-timeline-item--active" : ""}${index < activeStep ? " lp-case-timeline-item--done" : ""}`}
              >
                <div className="lp-case-timeline-rail" aria-hidden>
                  <span className="lp-case-timeline-dot">{step.num}</span>
                  {index < steps.length - 1 && <span className="lp-case-timeline-line" />}
                </div>

                <div className="lp-case-timeline-body">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>

                  {step.quote && (
                    <blockquote className="lp-case-quote">
                      <span className="lp-case-quote-label">{lp.caseQuoteLabel}</span>
                      «{step.quote}»
                    </blockquote>
                  )}

                  {step.outcome && (
                    <p className="lp-case-outcome">
                      <span className="lp-case-outcome-icon" aria-hidden>
                        ✓
                      </span>
                      {step.outcome}
                    </p>
                  )}

                  {step.bullets && (
                    <ul className="lp-case-bullets">
                      {step.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {CASE_VISUALS[index] && (
                    <div className="lp-case-visual">{CASE_VISUALS[index]}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <CaseFlowPanel phase={phase} />
        </div>
      </div>
    </div>
  );
}
