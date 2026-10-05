import { Check, EyeSlash, ShieldCheck } from "@phosphor-icons/react";
import { useI18n } from "../../i18n";
import { Reveal } from "./Reveal";

export function PrivacySplit() {
  const { messages } = useI18n();
  const t = messages.landing.privacy;

  return (
    <section className="lnd-privacy lnd-wrap" aria-labelledby="lnd-privacy-title">
      <h2 id="lnd-privacy-title">{t.title}</h2>
      <div className="lnd-privacy__grid">
        <Reveal className="lnd-privacy__col">
          <h3>{t.seesTitle}</h3>
          <ul>
            {t.sees.map((line) => (
              <li key={line}>
                <Check size={18} weight="bold" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="lnd-privacy__col lnd-privacy__col--hidden" delay={0.08}>
          <h3>{t.hiddenTitle}</h3>
          <ul>
            {t.hidden.map((line) => (
              <li key={line}>
                <EyeSlash size={18} aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <p className="lnd-privacy__note">
        <ShieldCheck size={18} aria-hidden />
        {t.note}
      </p>
    </section>
  );
}
