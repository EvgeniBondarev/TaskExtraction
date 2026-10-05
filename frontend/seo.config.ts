/**
 * Единый источник SEO и Open Graph (сборка index.html + runtime site.ts).
 * Для превью в Telegram / WhatsApp / VK нужен HTTPS и VITE_SITE_URL при сборке.
 */

export const SEO = {
  siteName: "TaskExtraction",
  locale: "ru_RU",
  themeColor: "#0f1419",

  /** Заголовок вкладки браузера */
  title: "TaskExtraction: задачи из Telegram на одной доске",

  /** Meta description для поисковиков */
  description:
    "Бот читает рабочие группы Telegram, находит поручения без тегов и команд и ведёт их на канбан-доске. Выгрузка в Jira, Trello, GitHub Issues и Slack.",

  /** Короткий заголовок карточки ссылки в мессенджерах */
  shareTitle: "TaskExtraction: задачи из Telegram на одной доске",

  /** Описание карточки ссылки (до ~200 символов — Telegram обрезает длиннее) */
  shareDescription:
    "Бот находит поручения в рабочих чатах Telegram и заводит карточки на доске. Ответы о статусе в чат, выгрузка в Jira, Trello, GitHub и Slack.",

  keywords:
    "telegram задачи, извлечение задач, kanban, jira, trello, slack, github issues, llm, поддержка, taskextraction, ai task manager",

  welcomePath: "/welcome",
  ogImagePath: "/og-image.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: "TaskExtraction: задачи из Telegram на одной доске",

  twitterCard: "summary_large_image" as const,
} as const;

/** Публичные URL для sitemap (личный кабинет и админка — только noindex). */
export const SITEMAP_PATHS: ReadonlyArray<{
  path: string;
  changefreq: "weekly" | "monthly";
  priority: number;
}> = [
  { path: "/welcome", changefreq: "weekly", priority: 1.0 },
  { path: "/", changefreq: "weekly", priority: 0.9 },
];
