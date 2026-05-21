import { useEffect, useState, type RefObject } from "react";
import { AppLogo } from "../AppLogo";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { useI18n } from "../../i18n";

const INTEGRATIONS = ["jira", "trello", "github", "slack"] as const;
export const CASE_FLOW_PHASE_COUNT = 5;

export function useCaseScrollPhase(trackRef: RefObject<HTMLElement | null>) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase(CASE_FLOW_PHASE_COUNT - 1);
      return;
    }

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const trackH = el.offsetHeight;
      const scrollRange = Math.max(trackH - vh * 0.5, 1);
      const scrolled = -rect.top + vh * 0.18;
      const progress = Math.min(1, Math.max(0, scrolled / scrollRange));
      setPhase(Math.min(CASE_FLOW_PHASE_COUNT - 1, Math.floor(progress * CASE_FLOW_PHASE_COUNT)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [trackRef]);

  return phase;
}

function VConn({ tone }: { tone: "tg" | "ai" | "out" }) {
  return <div className={`lp-case-vconn lp-case-vconn--${tone}`} aria-hidden />;
}

interface CaseFlowPanelProps {
  phase: number;
}

/** Панель анимации сценария — вертикальный поток */
export function CaseFlowPanel({ phase }: CaseFlowPanelProps) {
  const { messages: t } = useI18n();
  const flow = t.case.flow;
  const quote = t.case.steps[0]?.quote ?? "";

  return (
    <aside className="lp-case-panel" aria-label={flow.aria}>
      <p className="lp-case-panel__caption">{flow.panelCaption}</p>
      <div
        className={`lp-case-flow lp-case-flow--phase-${phase}`}
        role="img"
        aria-live="polite"
      >
        <div className="lp-case-flow__packet" aria-hidden />

        <div className="lp-case-flow__stack">
          <article className="lp-case-flow__node lp-case-flow__node--tg">
            <header className="lp-case-flow__node-head">
              <span className="lp-case-flow__node-icon lp-case-flow__node-icon--tg" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#229ED9" />
                  <path
                    d="M5.5 11.8l11.2-4.3c.5-.2 1 .1.8.9l-1.9 9c-.1.5-.4.6-.8.4l-2.2-1.6-1.1 1.1c-.1.1-.3.2-.5.2l.2-3.1 8.1-7.3c.1-.1 0-.2-.1-.1L9.6 13.5l-3.3 1.1c-.4.1-.4.4.1.5l.8.3 1.6.5 3.8 1.2c.5.2 1 .1.8-.9z"
                    fill="#fff"
                  />
                </svg>
              </span>
              <strong>Telegram</strong>
            </header>
            <div className="lp-case-flow__bubble">
              <p>{quote}</p>
            </div>
          </article>

          <VConn tone="tg" />

          <article className="lp-case-flow__node lp-case-flow__node--ai">
            <span className="lp-case-flow__node-icon lp-case-flow__node-icon--ai" aria-hidden>
              <AppLogo size={44} />
            </span>
            <strong>{flow.aiLabel}</strong>
            <span className="lp-case-flow__ai-pulse" aria-hidden />
            <span className="lp-case-flow__ai-spark" aria-hidden>
              ✦
            </span>
          </article>

          <VConn tone="ai" />

          <article className="lp-case-flow__node lp-case-flow__node--task">
            <span className="lp-case-flow__task-badge">{flow.taskBadge}</span>
            <div className="lp-case-flow__task-card">
              <span className="lp-case-flow__task-line" />
              <span className="lp-case-flow__task-line lp-case-flow__task-line--short" />
            </div>
          </article>

          <VConn tone="out" />

          <div className="lp-case-flow__integrations">
            {INTEGRATIONS.map((id) => (
              <div key={id} className="lp-case-flow__int">
                <IntegrationBrandIcon provider={id} size={28} />
                <span>{t.heroDiagram.integrations[id].name}</span>
              </div>
            ))}
          </div>
        </div>

        <ol className="lp-case-flow__steps">
          {flow.steps.map((label, i) => (
            <li key={label} className={i < phase ? "is-done" : i === phase ? "is-active" : undefined}>
              <span className="lp-case-flow__step-dot">{i + 1}</span>
              <span className="lp-case-flow__step-text">{label}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
