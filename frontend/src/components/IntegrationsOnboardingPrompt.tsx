import { IntegrationBrandIcon } from "./IntegrationBrandIcon";
import { getIntegrationsList } from "../hooks/useIntegrationsStatus";
import { useI18n } from "../i18n";
import "../styles/integrations-onboarding.css";

interface Props {
  onSetup: () => void;
  onSkip: () => void;
}

export function IntegrationsOnboardingPrompt({ onSetup, onSkip }: Props) {
  const { messages: t } = useI18n();
  const integrations = getIntegrationsList(t.settings.integrations);

  return (
    <div
      className="int-onboarding-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="int-onboarding-title"
    >
      <div className="int-onboarding-panel">
        <header className="int-onboarding-header">
          <div className="int-onboarding-header__icons" aria-hidden>
            {integrations.map((item) => (
              <span key={item.id} className={`int-onboarding-header__icon provider-${item.id}`}>
                <IntegrationBrandIcon provider={item.id} size={22} />
              </span>
            ))}
          </div>
          <p className="int-onboarding-eyebrow">{t.app.intEyebrow}</p>
          <h2 id="int-onboarding-title" className="int-onboarding-title">
            {t.app.intTitle}
          </h2>
          <p id="int-onboarding-lead" className="int-onboarding-lead">
            {t.app.intLead}
          </p>
        </header>

        <ul className="int-onboarding-list">
          {integrations.map((item) => (
            <li key={item.id} className={`int-onboarding-item provider-${item.id}`}>
              <span className="int-onboarding-item__icon">
                <IntegrationBrandIcon provider={item.id} size={26} />
              </span>
              <span className="int-onboarding-item__text">
                <strong>{item.name}</strong>
                <span>{item.tagline}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="int-onboarding-footnote">{t.app.intFootnote}</p>

        <div className="int-onboarding-actions">
          <button type="button" className="int-onboarding-primary" onClick={onSetup}>
            {t.app.intSetup}
          </button>
          <button type="button" className="int-onboarding-secondary" onClick={onSkip}>
            {t.app.intSkip}
          </button>
        </div>
      </div>
    </div>
  );
}
