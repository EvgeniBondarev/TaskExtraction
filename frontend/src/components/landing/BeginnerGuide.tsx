import { useI18n } from "../../i18n";
import { ScrollReveal } from "./ScrollReveal";

interface Props {
  onTry: () => void;
}

export function BeginnerGuide({ onTry }: Props) {
  const { messages: t } = useI18n();
  const lp = t.landing;
  const steps = t.guide.steps;

  return (
    <section className="lp-guide" id="guide" aria-labelledby="lp-guide-title">
      <ScrollReveal className="lp-section-head lp-section-head--center">
        <span className="lp-badge">{lp.guideBadge}</span>
        <h2 id="lp-guide-title">{lp.guideTitle}</h2>
        <p className="lp-section-lead">{lp.guideLead}</p>
      </ScrollReveal>

      <ol className="lp-guide-list">
        {steps.map((item, index) => (
          <ScrollReveal
            key={item.step}
            as="li"
            className="lp-guide-item"
            delay={index * 50}
            direction="up"
          >
            <div className="lp-guide-marker" aria-hidden>
              <span className="lp-guide-num">{item.step}</span>
            </div>
            <div className="lp-guide-body">
              <div className="lp-guide-head">
                <h3>{item.title}</h3>
                <span className="lp-guide-time">~{item.time}</span>
              </div>
              <p>{item.body}</p>
              <p className="lp-guide-tip">{item.tip}</p>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="lp-guide-link">
                  {item.linkLabel}
                </a>
              )}
            </div>
          </ScrollReveal>
        ))}
      </ol>

      <ScrollReveal className="lp-guide-cta" direction="scale">
        <p>{lp.guideCtaText}</p>
        <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={onTry}>
          {lp.guideCtaButton}
        </button>
      </ScrollReveal>
    </section>
  );
}
