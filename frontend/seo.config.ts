/**
 * Единый источник SEO и Open Graph (сборка index.html + runtime site.ts).
 * Для превью в Telegram / WhatsApp / VK нужен HTTPS и VITE_SITE_URL при сборке.
 */

export const SEO = {
  siteName: "TaskExtraction",
  locale: "ru_RU",
  themeColor: "#0f1419",

  /** Заголовок вкладки браузера */
  title: "TaskExtraction — AI-менеджер задач из Telegram",

  /** Meta description для поисковиков */
  description:
    "AI-система для извлечения задач из Telegram-чатов без тегов и спецслов: канбан, лента сообщений, интеграции с Jira, Trello, GitHub Issues и Slack.",

  /** Короткий заголовок карточки ссылки в мессенджерах */
  shareTitle: "TaskExtraction — задачи из Telegram в одной панели",

  /** Описание карточки ссылки (до ~200 символов — Telegram обрезает длиннее) */
  shareDescription:
    "Пиши в Telegram — выполняй везде. AI находит поручения в переписке без хештегов. Канбан, лента и выгрузка в Jira, Trello, GitHub и Slack. Старт за 5 минут.",

  keywords:
    "telegram задачи, извлечение задач, kanban, jira, trello, slack, github issues, llm, поддержка, taskextraction, ai task manager",

  welcomePath: "/welcome",
  ogImagePath: "/og-image.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: "TaskExtraction — Пиши в Telegram, выполняй везде",

  twitterCard: "summary_large_image" as const,
} as const;
