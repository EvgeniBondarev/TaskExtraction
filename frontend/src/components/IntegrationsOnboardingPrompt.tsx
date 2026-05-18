import { IntegrationBrandIcon } from "./IntegrationBrandIcon";
import { INTEGRATIONS } from "../hooks/useIntegrationsStatus";
import { useI18n } from "../i18n";

interface Props {
  onSetup: () => void;
  onSkip: () => void;
}

export function IntegrationsOnboardingPrompt({ onSetup, onSkip }: Props) {
  const { messages: t } = useI18n();

  return (
    <div
      className="int-onboarding-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="int-onboarding-title"
    >
      <div className="int-onboarding-card">
        <p className="int-onboarding-eyebrow">{t.app.intEyebrow}</p>
        <h2 id="int-onboarding-title">{t.app.intTitle}</h2>
        <p className="int-onboarding-lead">{t.app.intLead}</p>

        <ul className="int-onboarding-list">
          {INTEGRATIONS.map((item) => (
            <li key={item.id} className={`int-onboarding-item provider-${item.id}`}>
              <span className="int-onboarding-icon">
                <IntegrationBrandIcon provider={item.id} size={26} />
              </span>
              <span className="int-onboarding-item-text">
                <strong>{item.name}</strong>
                <span>{item.tagline}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="int-onboarding-actions">
          <button type="button" className="int-onboarding-primary" onClick={onSetup}>
            {t.app.intSetup}
          </button>
          <button type="button" className="int-onboarding-secondary" onClick={onSkip}>
            {t.app.intSkip}
          </button>
        </div>
      </div>

      <style>{`
        .int-onboarding-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          background: rgba(8, 12, 18, 0.72);
          backdrop-filter: blur(6px);
        }
        .int-onboarding-card {
          width: 100%;
          max-width: 480px;
          padding: 1.5rem 1.4rem 1.35rem;
          border-radius: 16px;
          border: 1px solid rgba(99, 102, 241, 0.35);
          background: linear-gradient(165deg, rgba(99, 102, 241, 0.14) 0%, var(--surface) 55%);
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
        }
        .int-onboarding-eyebrow {
          margin: 0 0 0.35rem;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #93c5fd;
        }
        .int-onboarding-card h2 {
          margin: 0 0 0.5rem;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .int-onboarding-lead {
          margin: 0 0 1.1rem;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--muted);
        }
        .int-onboarding-list {
          list-style: none;
          margin: 0 0 1.25rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .int-onboarding-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: rgba(15, 20, 25, 0.55);
        }
        .int-onboarding-icon {
          flex-shrink: 0;
          display: inline-flex;
        }
        .int-onboarding-item-text {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }
        .int-onboarding-item-text strong {
          font-size: 0.92rem;
          color: var(--text);
        }
        .int-onboarding-item-text span {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .int-onboarding-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .int-onboarding-primary {
          border: none;
          border-radius: 10px;
          padding: 0.7rem 1rem;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }
        .int-onboarding-primary:hover {
          filter: brightness(1.06);
        }
        .int-onboarding-secondary {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0.6rem 1rem;
          font: inherit;
          cursor: pointer;
          color: var(--muted);
          background: transparent;
        }
        .int-onboarding-secondary:hover {
          color: var(--text);
          border-color: rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
