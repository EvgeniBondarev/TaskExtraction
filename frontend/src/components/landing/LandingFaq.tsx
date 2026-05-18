import { FAQ_ITEMS } from "../../../seo.config";
import { ScrollReveal } from "./ScrollReveal";

export function LandingFaq() {
  return (
    <section className="lp-section lp-faq" id="faq" aria-labelledby="lp-faq-title">
      <ScrollReveal className="lp-section-head lp-section-head--center">
        <span className="lp-badge">FAQ</span>
        <h2 id="lp-faq-title">Частые вопросы</h2>
        <p className="lp-section-lead">
          Ответы о работе сервиса, интеграциях и запуске — для команды поддержки и разработки.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={60}>
        <dl className="lp-faq-list">
          {FAQ_ITEMS.map((item) => (
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
