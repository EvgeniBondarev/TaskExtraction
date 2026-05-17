export interface SetupStepItem {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  steps: SetupStepItem[];
  /** Index of the active step (0-based) */
  currentIndex: number;
  /** Highest completed step index (-1 if none) */
  completedThrough: number;
}

export function SetupStepper({ steps, currentIndex, completedThrough }: Props) {
  const progress =
    steps.length <= 1 ? 0 : (Math.min(currentIndex, steps.length - 1) / (steps.length - 1)) * 100;

  return (
    <nav className="setup-stepper" aria-label="Этапы настройки">
      <div className="stepper-track" aria-hidden>
        <div className="stepper-fill" style={{ width: `${progress}%` }} />
      </div>
      <ol className="stepper-list">
        {steps.map((step, i) => {
          const done = i <= completedThrough;
          const active = i === currentIndex;
          const upcoming = i > currentIndex;
          return (
            <li
              key={step.id}
              className={`stepper-item${done ? " done" : ""}${active ? " active" : ""}${upcoming ? " upcoming" : ""}`}
              aria-current={active ? "step" : undefined}
            >
              <span className="stepper-marker" aria-hidden>
                {done && !active ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 7.2L5.8 10.5L11.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="stepper-num">{i + 1}</span>
                )}
              </span>
              <span className="stepper-text">
                <strong>{step.label}</strong>
                {step.description && <span className="stepper-desc">{step.description}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <style>{`
        .setup-stepper { margin-bottom: 1.5rem; }
        .stepper-track {
          height: 3px;
          background: var(--border);
          border-radius: 99px;
          margin-bottom: 1.25rem;
          overflow: hidden;
        }
        .stepper-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #22d3ee);
          border-radius: 99px;
          transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stepper-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.65rem;
        }
        .stepper-item {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.65rem 0.75rem;
          border-radius: 10px;
          border: 1px solid transparent;
          transition: background 0.2s, border-color 0.2s;
        }
        .stepper-item.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.35);
        }
        .stepper-item.done:not(.active) {
          opacity: 0.85;
        }
        .stepper-item.upcoming {
          opacity: 0.55;
        }
        .stepper-marker {
          flex-shrink: 0;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          background: var(--bg);
          border: 2px solid var(--border);
          color: var(--muted);
          transition: all 0.25s;
        }
        .stepper-item.active .stepper-marker {
          border-color: var(--accent);
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .stepper-item.done .stepper-marker {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        .stepper-text {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .stepper-text strong {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text);
          line-height: 1.2;
        }
        .stepper-desc {
          font-size: 0.7rem;
          color: var(--muted);
          line-height: 1.3;
        }
        @media (max-width: 520px) {
          .stepper-list { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </nav>
  );
}
