/** SEO и Open Graph — подставьте свой домен при сборке (VITE_SITE_URL). */

const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "";

export const SITE = {
  name: "TaskExtraction",
  title: "TaskExtraction — AI-менеджер задач из Telegram",
  shortTitle: "TaskExtraction",
  description:
    "AI-система для извлечения задач из чатов Telegram: канбан, лента сообщений, интеграции с Jira, Trello, GitHub и Slack.",
  keywords:
    "telegram задачи, извлечение задач, kanban, jira, trello, slack, llm, поддержка, taskextraction",
  locale: "ru_RU",
  themeColor: "#0f1419",
  twitterCard: "summary_large_image" as const,
  /** Путь на сайте (абсолютный URL собирается при наличии VITE_SITE_URL) */
  ogImagePath: "/og-image.png",
  welcomePath: "/welcome",
} as const;

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!siteUrl) return p;
  return `${siteUrl}${p}`;
}

export function pageTitle(suffix?: string): string {
  if (!suffix) return SITE.title;
  return `${suffix} · ${SITE.shortTitle}`;
}
