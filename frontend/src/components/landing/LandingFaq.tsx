import { Plus } from "@phosphor-icons/react";
import { useI18n } from "../../i18n";

export function LandingFaq() {
  const { messages } = useI18n();

  return (
    <section className="lnd-faq lnd-wrap" id="faq" aria-labelledby="lnd-faq-title">
      <h2 id="lnd-faq-title">{messages.landing.faq.title}</h2>
      <div className="lnd-faq__list">
        {messages.faq.items.map((item, i) => (
          <details key={item.question} open={i === 0}>
            <summary>
              {item.question}
              <Plus size={18} aria-hidden />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
