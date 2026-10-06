import { Check, EyeSlash, ShieldCheck } from "@phosphor-icons/react";
import { motion } from "motion/react";
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
            {t.sees.map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              >
                <Check size={18} weight="bold" aria-hidden />
                {line}
              </motion.li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="lnd-privacy__col lnd-privacy__col--hidden" delay={0.08}>
          <h3>{t.hiddenTitle}</h3>
          <ul>
            {t.hidden.map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
              >
                <EyeSlash size={18} aria-hidden />
                {line}
              </motion.li>
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
