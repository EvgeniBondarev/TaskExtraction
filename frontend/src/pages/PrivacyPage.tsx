import { SeoHead } from "../components/SeoHead";
import { useI18n } from "../i18n";
import "../styles/legal.css";

export function PrivacyPage() {
  const { messages, locale } = useI18n();
  const p = messages.privacy;

  return (
    <>
      <SeoHead path="/privacy" title={p.metaTitle} description={p.metaDescription} />
      <div className="legal-page">
        <header className="legal-header">
          <a href="/welcome" className="legal-back">
            ← {p.back}
          </a>
          <h1>{p.title}</h1>
          <p className="legal-updated">{p.updated}</p>
        </header>

        <article className="legal-body" lang={locale}>
          {p.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
