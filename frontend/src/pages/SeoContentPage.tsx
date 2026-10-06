import { SEO_PAGE_BY_PATH, type SeoPage } from "../content/seoPages";
import { SeoHead } from "../components/SeoHead";
import { AppLogo } from "../components/AppLogo";
import "../styles/seo-content.css";

export function SeoContentPage() {
  const path = window.location.pathname.endsWith("/") ? window.location.pathname : `${window.location.pathname}/`;
  const page = SEO_PAGE_BY_PATH.get(path);
  if (!page) return null;
  const allPages = [...SEO_PAGE_BY_PATH.values()];
  const related: SeoPage[] = page.path === "/blog/"
    ? allPages.filter((item) => item.path.startsWith("/blog/") && item.path !== page.path)
    : [allPages.find((item) => item.path === "/blog/"), ...allPages.filter((item) => item.path !== page.path && item.path !== "/blog/").slice(0, 2)].filter((item): item is SeoPage => Boolean(item));
  const shot = `/landing/${page.image}-light.jpg`;
  return <><SeoHead path={page.path} title={page.title} description={page.description} useSharePreview={false} />
    <main className="seo-page"><nav className="seo-page__nav"><a href="/"><AppLogo size={28} showText /></a><a href="/login" className="seo-page__button">Попробовать бесплатно</a></nav>
      <article><header><p className="seo-page__eyebrow">TaskExtraction · работа с задачами в Telegram</p><h1>{page.h1}</h1><p className="seo-page__lead">{page.lead}</p><a href="/login" className="seo-page__button">Попробовать TaskExtraction</a></header>
        <figure><img src={shot} alt={page.imageAlt} width="1600" height="1028" /><figcaption>Интерфейс TaskExtraction: задачи сохраняют связь с исходной перепиской.</figcaption></figure>
        <div className="seo-page__diagram" aria-label="Схема работы TaskExtraction"><span>Сообщение в Telegram</span><b>→</b><span>Понятная задача</span><b>→</b><span>Статус и действие команды</span></div>
        {page.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
        <aside className="seo-page__cta"><h2>Хотите перестать терять задачи в переписке?</h2><p>Подключите рабочий чат и посмотрите, как поручения превращаются в карточки с контекстом.</p><a href="/login" className="seo-page__button">Открыть TaskExtraction</a></aside>
        <nav className="seo-page__related" aria-label="Материалы по теме"><h2>Читайте также</h2><ul>{related.map((item) => <li key={item.path}><a href={item.path}>{item.h1}</a></li>)}</ul></nav>
      </article></main></>;
}
