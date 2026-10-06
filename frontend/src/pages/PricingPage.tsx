import { SeoHead } from "../components/SeoHead";
import { PRICING_FAQ, PRICING_PAGE, PRICING_PLANS } from "../content/pricing";
import "../styles/pricing.css";

function Check() {
  return (
    <svg className="pricing__check" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PricingPage() {
  return (
    <>
      <SeoHead path={PRICING_PAGE.path} title={PRICING_PAGE.title} description={PRICING_PAGE.description} useSharePreview={false} useLocaleMeta={false} />
      <div className="pricing">
        <nav className="pricing__nav" aria-label="Основная навигация">
          <a href="/" aria-label="TaskExtraction"><img src="/brand/logo-mark.svg" alt="" width="28" height="28" /><span>TaskExtraction</span></a>
          <span className="pricing__nav-links">
            <a href="/features/">Возможности</a>
            <a href="/integrations/">Интеграции</a>
            <a href="/blog/">Блог</a>
            <a href="/login" className="pricing__button pricing__button--small">Войти</a>
          </span>
        </nav>
        <main>
          <header className="pricing__hero">
            <div className="pricing__hero-copy">
              <p className="pricing__badge">{PRICING_PAGE.badge}</p>
              <h1>{PRICING_PAGE.h1}</h1>
              <p className="pricing__lead">{PRICING_PAGE.lead}</p>
            </div>
            <img className="pricing__hero-art" src="/landing/premium/hero-flow.webp" alt="" width="1717" height="916" />
          </header>

          <section className="pricing__grid" aria-label="Варианты использования">
            {PRICING_PLANS.map((plan) => (
              <article key={plan.name} className={`pricing__card${plan.featured ? " pricing__card--featured" : ""}`}>
                <div className="pricing__card-art"><img src={plan.art} alt="" width="1024" height="1024" loading="lazy" decoding="async" /></div>
                <h2>{plan.name}</h2>
                <p className="pricing__tagline">{plan.tagline}</p>
                <p className="pricing__price">{plan.price}</p>
                <p className="pricing__note">{plan.priceNote}</p>
                <a href={plan.ctaHref} className={`pricing__button${plan.featured ? "" : " pricing__button--ghost"}`} {...(plan.ctaHref.startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{plan.cta}</a>
                <h3>{plan.featuresTitle}</h3>
                <ul>{plan.features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul>
              </article>
            ))}
          </section>

          <section className="pricing__faq" aria-labelledby="pricing-faq">
            <h2 id="pricing-faq">Частые вопросы о цене</h2>
            {PRICING_FAQ.map((item) => (
              <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>
            ))}
          </section>

          <aside className="pricing__cta">
            <h2>Попробуйте на своём рабочем чате</h2>
            <p>Подключение занимает несколько минут, а платить не придётся.</p>
            <a href="/login" className="pricing__button">Открыть TaskExtraction</a>
          </aside>
        </main>
        <footer className="pricing__footer">
          <a href="/privacy/">Политика конфиденциальности</a>
          <a href="/">На главную</a>
        </footer>
      </div>
    </>
  );
}
