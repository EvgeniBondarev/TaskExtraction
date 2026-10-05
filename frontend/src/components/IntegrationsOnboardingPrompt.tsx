import { motion } from "motion/react";
import { getIntegrationsList } from "../hooks/useIntegrationsStatus";
import { useI18n } from "../i18n";
import { IntegrationBrandIcon } from "./IntegrationBrandIcon";

interface Props {
  onSetup: () => void;
  onSkip: () => void;
}

export function IntegrationsOnboardingPrompt({ onSetup, onSkip }: Props) {
  const { messages: t } = useI18n();
  const integrations = getIntegrationsList(t.settings.integrations);

  return (
    <div className="te-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="int-onboarding-title">
      <motion.div
        className="te-dialog-backdrop"
        onClick={onSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.div
        className="te-dialog"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <p className="te-muted">{t.app.intEyebrow}</p>
        <h2 id="int-onboarding-title">{t.app.intTitle}</h2>
        <p className="te-dialog__lead">{t.app.intLead}</p>

        <ul className="te-dialog__list">
          {integrations.map((item) => (
            <li key={item.id}>
              <IntegrationBrandIcon provider={item.id} size={20} />
              <span>
                <strong>{item.name}</strong>
                <small>{item.tagline}</small>
              </span>
            </li>
          ))}
        </ul>

        <p className="te-field__hint">{t.app.intFootnote}</p>
        <div className="te-dialog__actions">
          <button type="button" className="te-btn te-btn--ghost" onClick={onSkip}>
            {t.app.intSkip}
          </button>
          <button type="button" className="te-btn te-btn--primary" onClick={onSetup}>
            {t.app.intSetup}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
