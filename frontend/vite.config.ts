import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SEO, SITEMAP_PATHS } from "./seo.config";
import { SEO_PAGES, isArticlePath, relatedSeoPages, seoBreadcrumbs, type SeoPage } from "./src/content/seoPages";

const STATIC_LANDING = `<!--seo-static-start-->
<main class="seo-static" aria-label="TaskExtraction">
  <header><p>TaskExtraction</p><h1>ИИ-сервис для извлечения задач из Telegram</h1></header>
  <p>TaskExtraction автоматически находит поручения в переписке Telegram, помогает команде вести их на канбан-доске и отправлять в привычные инструменты.</p>
  <section><h2>Автоматическое создание задач из сообщений Telegram</h2><p>Сервис отличает задачу от обычной переписки, сохраняет контекст, сроки и исполнителя. Не нужны теги, команды и ручное копирование сообщений.</p></section>
  <section><h2>Управление задачами в Telegram для команды</h2><p>Новые задачи появляются на доске со статусами «Новые», «В работе», «Готово» и «Архив». Из карточки можно ответить в исходный чат.</p></section>
  <section><h2>Интеграции с рабочими инструментами</h2><p>Выгружайте задачи в Jira, Trello, GitHub Issues и Slack автоматически или вручную — без изменения привычного процесса команды.</p></section>
  <section><h2>Как работает TaskExtraction</h2><ol><li>Подключите рабочую группу или разрешённые диалоги Telegram.</li><li>ИИ анализирует входящие сообщения и выделяет поручения.</li><li>Команда ведёт задачи на доске и получает обновления в чате.</li></ol></section>
  <section><h2>Частые вопросы</h2><p>Для работы не нужны хештеги и команды боту. Данные каждой рабочей области изолированы, а интеграции подключаются только по вашему выбору.</p></section>
  <nav aria-label="Разделы сайта"><h2>Материалы и интеграции</h2><ul><li><a href="/features/">Возможности</a></li><li><a href="/telegram-task-manager/">Таск-менеджер для Telegram</a></li><li><a href="/integrations/">Интеграции</a></li><li><a href="/integrations/telegram-jira/">Telegram + Jira</a></li><li><a href="/integrations/telegram-trello/">Telegram + Trello</a></li><li><a href="/integrations/telegram-github/">Telegram + GitHub</a></li><li><a href="/integrations/telegram-slack/">Telegram + Slack</a></li><li><a href="/blog/">Блог</a></li><li><a href="/privacy/">Политика конфиденциальности</a></li></ul></nav>
</main><!--seo-static-end-->`;

const STATIC_PRIVACY = `<!--seo-static-start--><main class="seo-static"><h1>Политика конфиденциальности TaskExtraction</h1><p>Здесь описано, какие данные использует сервис и как защищаются рабочие области пользователей.</p><p>TaskExtraction обрабатывает только данные, необходимые для работы с подключёнными чатами и интеграциями.</p></main><!--seo-static-end-->`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function siteHost(siteUrl: string): string {
  try {
    return new URL(siteUrl).host;
  } catch {
    return "localhost";
  }
}

function buildSitemapXml(base: string, lastmod: string): string {
  const urls = [...SITEMAP_PATHS, ...SEO_PAGES.map((page) => ({ path: page.path, changefreq: "monthly" as const, priority: page.path.split("/").filter(Boolean).length === 1 ? 0.8 : 0.7 }))].map(
    (entry) => `  <url>
    <loc>${base}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function staticSeoPage(page: SeoPage): string {
  const sections = page.sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</section>`).join("");
  const image = `/landing/${page.image}-light.jpg`;
  const related = relatedSeoPages(page);
  const links = related.map((item) => `<li><a href="${item.path}">${escapeHtml(item.h1)}</a></li>`).join("");
  return `<!--seo-static-start--><main class="seo-static" aria-label="${escapeHtml(page.h1)}"><article><header><p>TaskExtraction · работа с задачами в Telegram</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.lead)}</p><a href="/login">Попробовать TaskExtraction</a></header><figure><img src="${image}" alt="${escapeHtml(page.imageAlt)}" width="1600" height="1028" fetchpriority="high" decoding="async"><figcaption>Интерфейс TaskExtraction: задачи сохраняют связь с исходной перепиской.</figcaption></figure><div aria-label="Схема работы: сообщение в Telegram превращается в задачу, а затем в действие команды"><span>Сообщение в Telegram</span> → <span>Понятная задача</span> → <span>Статус и действие команды</span></div>${sections}<aside><h2>Хотите перестать терять задачи в переписке?</h2><p>Подключите рабочий чат и посмотрите, как поручения превращаются в карточки с контекстом.</p><a href="/login">Открыть TaskExtraction</a></aside><nav aria-label="Материалы по теме"><h2>Читайте также</h2><ul>${links}</ul></nav></article></main><!--seo-static-end-->`;
}

function jsonLdScript(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function homeJsonLd(base: string, description: string, url: string, image: string): string {
  return jsonLdScript([
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "TaskExtraction",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description,
      url,
      image,
      inLanguage: "ru",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    { "@context": "https://schema.org", "@type": "Organization", name: "TaskExtraction", url: base, logo: `${base}/brand/logo-mark-512.png` },
    { "@context": "https://schema.org", "@type": "WebSite", name: "TaskExtraction", url: base, inLanguage: "ru" },
  ]);
}

function pageJsonLd(base: string, page: SeoPage, image: string, lastmod: string): string {
  const url = `${base}${page.path}`;
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: seoBreadcrumbs(page).map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${base}${crumb.path}` })),
  };
  const main = isArticlePath(page.path)
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.h1,
        description: page.description,
        image,
        inLanguage: "ru",
        mainEntityOfPage: url,
        dateModified: lastmod,
        author: { "@type": "Organization", name: "TaskExtraction", url: base },
        publisher: { "@type": "Organization", name: "TaskExtraction", url: base, logo: { "@type": "ImageObject", url: `${base}/brand/logo-mark-512.png` } },
      }
    : { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.description, url, inLanguage: "ru", isPartOf: { "@type": "WebSite", name: "TaskExtraction", url: base } };
  return jsonLdScript([main, crumbs]);
}

function seoSitePlugin(siteUrl: string, isProd: boolean): Plugin {
  const base = (siteUrl || "http://localhost:5173").replace(/\/$/, "");
  const canonical = `${base}${SEO.welcomePath}`;
  const host = siteHost(base);
  const lastmod = new Date().toISOString().slice(0, 10);

  const yandexVerification = process.env.VITE_YANDEX_VERIFICATION?.trim() || "";
  const googleVerification = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim() || "";

  const yandexMeta = yandexVerification
    ? `    <meta name="yandex-verification" content="${escapeHtml(yandexVerification)}" />`
    : "";
  const googleMeta = googleVerification
    ? `    <meta name="google-site-verification" content="${escapeHtml(googleVerification)}" />`
    : "";

  const vars: Record<string, string> = {
    __SITE_URL__: base,
    __SITE_HOST__: host,
    __SEO_TITLE__: escapeHtml(SEO.title),
    __SEO_DESCRIPTION__: escapeHtml(SEO.description),
    __SEO_SHARE_TITLE__: escapeHtml(SEO.shareTitle),
    __SEO_SHARE_DESCRIPTION__: escapeHtml(SEO.shareDescription),
    __SEO_KEYWORDS__: escapeHtml(SEO.keywords),
    __SEO_OG_IMAGE_ALT__: escapeHtml(SEO.ogImageAlt),
    __SEO_CANONICAL__: canonical,
    __SEO_OG_IMAGE__: `${base}${SEO.ogImagePath}`,
    __SEO_OG_WIDTH__: String(SEO.ogImageWidth),
    __SEO_OG_HEIGHT__: String(SEO.ogImageHeight),
    __SEO_OG_TYPE__: "website",
    __SEO_JSONLD__: homeJsonLd(base, SEO.description, canonical, `${base}${SEO.ogImagePath}`),
    __YANDEX_VERIFICATION_META__: yandexMeta,
    __GOOGLE_VERIFICATION_META__: googleMeta,
  };

  const taskPreviewVars: Record<string, string> = {
    ...vars,
    __SEO_TITLE__: "Задача · TaskExtraction",
    __SEO_DESCRIPTION__: "Карточка задачи в рабочем пространстве TaskExtraction.",
    __SEO_SHARE_TITLE__: "Задача в TaskExtraction",
    __SEO_SHARE_DESCRIPTION__: "Откройте карточку задачи, чтобы посмотреть статус, детали и обсуждение с командой.",
    __SEO_CANONICAL__: `${base}/task`,
    __SEO_JSONLD__: "",
  };

  const privacyPreviewVars: Record<string, string> = {
    ...vars,
    __SEO_TITLE__: "Политика конфиденциальности · TaskExtraction",
    __SEO_DESCRIPTION__: "Политика конфиденциальности сервиса TaskExtraction.",
    __SEO_SHARE_TITLE__: "Политика конфиденциальности TaskExtraction",
    __SEO_SHARE_DESCRIPTION__: "Как TaskExtraction обрабатывает и защищает данные рабочих областей.",
    __SEO_CANONICAL__: `${base}/privacy/`,
    __SEO_JSONLD__: "",
  };

  const replacePlaceholders = (content: string, replacements = vars) => {
    let out = content;
    for (const [key, value] of Object.entries(replacements)) {
      out = out.replaceAll(key, value);
    }
    return out;
  };

  const staticPage = (content: string, replacements: Record<string, string>, markup: string, noindex = false) => {
    let page = replacePlaceholders(content, replacements);
    page = page.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    if (noindex) {
      page = page.replace('content="index, follow, max-image-preview:large"', 'content="noindex, nofollow"');
    }
    return page;
  };

  return {
    name: "seo-site-url",
    configResolved() {
      if (isProd && (!siteUrl || base.includes("localhost"))) {
        console.warn(
          "\n⚠️  VITE_SITE_URL не задан или указывает на localhost.\n" +
            "   SEO (sitemap, canonical, OG) не будут корректны для продакшена.\n" +
            "   Соберите с: VITE_SITE_URL=https://task-extraction.ru npm run build\n",
        );
      }
    },
    transformIndexHtml(html) {
      return staticPage(html, vars, STATIC_LANDING);
    },
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      const taskDir = resolve(dist, "task");
      const compiledIndex = readFileSync(resolve(dist, "index.html"), "utf-8");
      // Vite кладёт module script раньше извлечённого CSS. На медленном соединении
      // React успевает отрисовать страницу до прихода стилей, что даёт заметный FOUC.
      // Переносим stylesheet перед приложением во всех статических входных HTML.
      const stylesheetLinks = compiledIndex.match(/<link rel="stylesheet"[^>]+>/g)?.join("\n") || "";
      // Шрифты браузер находит только внутри CSS и грузит после него — текст мигает запасным шрифтом.
      // Preload основных начертаний (кириллица и латиница) убирает эту задержку.
      const fontPreloads = readdirSync(resolve(dist, "assets"))
        .filter((file) => /^geist-(cyrillic|latin)-wght-normal-.+\.woff2$/.test(file))
        .map((file) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${file}">`)
        .join("\n");
      const bundleStyles = [fontPreloads, stylesheetLinks].filter(Boolean).join("\n");
      const compiledIndexWithStylesFirst = bundleStyles
        ? compiledIndex
          .replace(/<link rel="stylesheet"[^>]+>\s*/g, "")
          .replace(/(<script type="module"[^>]+src="[^"]+\.js"[^>]*><\/script>)/, `${bundleStyles}\n    $1`)
        : compiledIndex;
      writeFileSync(resolve(dist, "index.html"), compiledIndexWithStylesFirst, { encoding: "utf-8" });
      const bundleScript = compiledIndex.match(/src="([^"]+\.js)"/)?.[1] || '/assets/index.js';
      const withBundleAssets = (html: string) => html
        .replace('/src/main.tsx', bundleScript)
        .replace('</head>', `${bundleStyles}\n  </head>`);
      const taskHtml = withBundleAssets(staticPage(readFileSync(resolve(__dirname, "index.html"), "utf-8"), taskPreviewVars, "", true));
      const privacyHtml = withBundleAssets(staticPage(readFileSync(resolve(__dirname, "index.html"), "utf-8"), privacyPreviewVars, STATIC_PRIVACY));
      mkdirSync(taskDir, { recursive: true });
      writeFileSync(resolve(taskDir, "index.html"), taskHtml, { encoding: "utf-8", flag: "w" });
      const privacyDir = resolve(dist, "privacy");
      mkdirSync(privacyDir, { recursive: true });
      writeFileSync(resolve(privacyDir, "index.html"), privacyHtml, { encoding: "utf-8", flag: "w" });
      for (const page of SEO_PAGES) {
        const dir = resolve(dist, page.path.replace(/^\//, ""));
        mkdirSync(dir, { recursive: true });
        const pageVars = {
          ...vars,
          __SEO_TITLE__: escapeHtml(page.title),
          __SEO_DESCRIPTION__: escapeHtml(page.description),
          __SEO_SHARE_TITLE__: escapeHtml(page.title),
          __SEO_SHARE_DESCRIPTION__: escapeHtml(page.description),
          __SEO_CANONICAL__: `${base}${page.path}`,
          __SEO_OG_TYPE__: isArticlePath(page.path) ? "article" : "website",
          __SEO_JSONLD__: pageJsonLd(base, page, `${base}/landing/${page.image}-light.jpg`, lastmod),
        };
        const pageHtml = withBundleAssets(staticPage(readFileSync(resolve(__dirname, "index.html"), "utf-8"), pageVars, staticSeoPage(page)));
        writeFileSync(resolve(dir, "index.html"), pageHtml, { encoding: "utf-8", flag: "w" });
      }
      const notFoundHtml = withBundleAssets(staticPage(readFileSync(resolve(__dirname, "index.html"), "utf-8"), {
        ...vars,
        __SEO_TITLE__: "Страница не найдена · TaskExtraction",
        __SEO_DESCRIPTION__: "Такой страницы нет. Вернитесь на главную TaskExtraction.",
        __SEO_CANONICAL__: `${base}/`,
        __SEO_JSONLD__: "",
      }, '<!--seo-static-start--><main class="seo-static"><h1>Страница не найдена</h1><p>Такой страницы нет или она переехала.</p><p><a href="/">Вернуться на главную TaskExtraction</a> · <a href="/blog/">Блог</a></p></main><!--seo-static-end-->', true)
        // 404 — статический документ без SPA: роутер не должен подменить его главной.
        .replace(/<script type="module"[^>]*><\/script>\s*/g, ""));
      writeFileSync(resolve(dist, "404.html"), notFoundHtml, { encoding: "utf-8" });
      writeFileSync(resolve(dist, "sitemap.xml"), buildSitemapXml(base, lastmod));

      const robotsPath = resolve(__dirname, "public/robots.txt");
      try {
        writeFileSync(
          resolve(dist, "robots.txt"),
          replacePlaceholders(readFileSync(robotsPath, "utf-8")),
        );
      } catch {
        /* ignore */
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const siteUrl = process.env.VITE_SITE_URL || "";
  const isProd = mode === "production";

  return {
    plugins: [react(), seoSitePlugin(siteUrl, isProd)],
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:8000",
        "/ws": { target: "ws://localhost:8000", ws: true },
      },
    },
  };
});
