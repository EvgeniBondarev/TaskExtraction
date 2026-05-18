import { useI18n } from "../../i18n";
import { ScrollReveal } from "./ScrollReveal";

export function LandingFaq() {
  const { messages: t } = useI18n();
  const lp = t.landing;

  return (
    <section className="lp-section lp-faq" id="faq" aria-labelledby="lp-faq-title">
      <ScrollReveal className="lp-section-head lp-section-head--center">
        <span className="lp-badge">{lp.faqBadge}</span>
        <h2 id="lp-faq-title">{lp.faqTitle}</h2>
        <p className="lp-section-lead">{lp.faqLead}</p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <dl className="lp-faq-list">
          {t.faq.items.map((item) => (
            <div key={item.question} className="lp-faq-item">
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
      </ScrollReveal>
    </section>
  );
}
