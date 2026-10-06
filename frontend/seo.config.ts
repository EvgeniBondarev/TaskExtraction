/**
 * Единый источник SEO и Open Graph (сборка index.html + runtime site.ts).
 * Для превью в Telegram / WhatsApp / VK нужен HTTPS и VITE_SITE_URL при сборке.
 */

export const SEO = {
  siteName: "TaskExtraction",
  locale: "ru_RU",
  themeColor: "#0f1419",

  /** Заголовок вкладки браузера */
  title: "TaskExtraction — извлечение задач из Telegram с помощью ИИ",

  /** Meta description для поисковиков */
  description:
    "TaskExtraction автоматически извлекает задачи из переписки Telegram, определяет сроки и помогает организовать работу. Канбан-доска и интеграции с Jira, Trello, GitHub и Slack.",

  /** Короткий заголовок карточки ссылки в мессенджерах */
  shareTitle: "TaskExtraction: задачи из Telegram на одной доске",

  /** Описание карточки ссылки (до ~200 символов — Telegram обрезает длиннее) */
  shareDescription:
    "Бот находит поручения в рабочих чатах Telegram и заводит карточки на доске. Ответы о статусе в чат, выгрузка в Jira, Trello, GitHub и Slack.",

  keywords:
    "telegram задачи, извлечение задач, kanban, jira, trello, slack, github issues, llm, поддержка, taskextraction, ai task manager",

  welcomePath: "/",
  // Версия URL заставляет мессенджеры запросить обновлённую карточку, а не взять
  // старый вариант из собственного кэша.
  ogImagePath: "/og-image.png?v=3",
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
  { path: "/", changefreq: "weekly", priority: 0.9 },
  { path: "/privacy/", changefreq: "monthly", priority: 0.2 },
];
