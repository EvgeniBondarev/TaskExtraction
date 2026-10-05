import { ArrowUpRight, Briefcase, GoogleLogo, TelegramLogo } from "@phosphor-icons/react";
import { useI18n } from "../../i18n";
import { Reveal } from "./Reveal";

const ICONS = [GoogleLogo, TelegramLogo, Briefcase, ArrowUpRight];

export function SetupSteps() {
  const { messages } = useI18n();
  const t = messages.landing.setup;

  return (
    <section className="lnd-setup lnd-wrap" id="setup" aria-labelledby="lnd-setup-title">
      <div className="lnd-setup__intro">
        <h2 id="lnd-setup-title">{t.title}</h2>
        <p>{t.lead}</p>
      </div>
      <ol className="lnd-setup__list">
        {t.steps.map((step, i) => {
          const Icon = ICONS[i] ?? ArrowUpRight;
          return (
            <Reveal as="li" key={step.title} delay={i * 0.06}>
              <span className="lnd-setup__icon" aria-hidden>
                <Icon size={22} />
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}
