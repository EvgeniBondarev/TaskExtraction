import { ArrowLeft, Check, TelegramLogo } from "@phosphor-icons/react";
import { AppLogo } from "../components/AppLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { SeoHead } from "../components/SeoHead";
import { ThemeSwitch } from "../components/ThemeSwitch";
import { useI18n } from "../i18n";
import "@fontsource-variable/geist";
import "../styles/ui.css";

const CONTACT_URL = "https://t.me/Burn1ngSnow";

export function PrivacyPage() {
  const { messages, locale } = useI18n();
  const p = messages.privacy;

  return (
    <>
      <SeoHead path="/privacy" title={p.metaTitle} description={p.metaDescription} />
      <div className="te-theme te-app te-legal">
        <header className="te-legal__nav te-glass">
          <a href="/welcome" className="te-login__brand">
            <AppLogo size={26} />
            <span>TaskExtraction</span>
          </a>
          <span className="te-login__tools">
            <ThemeSwitch />
            <LanguageSwitcher className="lang-switch--compact" />
          </span>
        </header>

        <div className="te-legal__layout">
          <aside className="te-legal__toc" aria-label={p.tocTitle}>
            <a href="/welcome" className="te-btn te-btn--quiet te-btn--sm te-legal__back">
              <ArrowLeft size={16} aria-hidden />
              {p.back}
            </a>
            <span className="te-field__label">{p.tocTitle}</span>
            <ol>
              {p.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </aside>

          <main className="te-legal__body" lang={locale}>
            <h1>{p.title}</h1>
            <p className="te-muted">{p.updated}</p>

            <section className="te-legal__summary" aria-label={p.summaryTitle}>
              <h2>{p.summaryTitle}</h2>
              <ul>
                {p.summary.map((line) => (
                  <li key={line}>
                    <Check size={16} weight="bold" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </section>

            {p.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="te-legal__section">
                <h2>
                  <span className="te-legal__num">{i + 1}</span>
                  {s.title}
                </h2>
                {s.items && (
                  <ul className="te-legal__list">
                    {s.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {s.paragraphs?.map((para) => <p key={para}>{para}</p>)}
              </section>
            ))}

            <a className="te-legal__contact" href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
              <TelegramLogo size={22} weight="fill" aria-hidden />
              <span>
                <small>{p.contactLabel}</small>
                <strong>@Burn1ngSnow</strong>
              </span>
            </a>
          </main>
        </div>
      </div>
    </>
  );
}
