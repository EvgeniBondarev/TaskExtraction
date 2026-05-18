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

/** Публичные URL для sitemap (личный кабинет и админка — только noindex). */
export const SITEMAP_PATHS: ReadonlyArray<{
  path: string;
  changefreq: "weekly" | "monthly";
  priority: number;
}> = [
  { path: "/welcome", changefreq: "weekly", priority: 1.0 },
  { path: "/", changefreq: "weekly", priority: 0.9 },
];

/** FAQ для лендинга и JSON-LD (FAQPage). */
export const FAQ_ITEMS: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: "Что такое TaskExtraction?",
    answer:
      "Это веб-панель, которая подключается к рабочим чатам Telegram, находит поручения в обычных сообщениях с помощью LLM и ведёт их в канбане. Задачи можно выгружать в Jira, Trello, GitHub Issues и Slack.",
  },
  {
    question: "Нужны ли хештеги или специальные команды в чате?",
    answer:
      "Нет. Система анализирует обычный текст: «сделайте до пятницы», «не работает оплата», «добавьте кнопку» — без #task и без ботов в чате.",
  },
  {
    question: "Какие интеграции поддерживаются?",
    answer:
      "Jira, Trello, GitHub Issues и Slack. После создания задачи в панели её можно отправить во внешнюю систему или включить автоматическую выгрузку.",
  },
  {
    question: "Где хранятся данные?",
    answer:
      "При развёртывании через Docker данные (БД, медиа, сессия Telegram) остаются на вашем сервере в подключённом volume. Ключи API и токены шифруются.",
  },
  {
    question: "Сколько времени занимает запуск?",
    answer:
      "Около 5–15 минут: ключи my.telegram.org, вход в Telegram, выбор чатов и настройка LLM. Подробный гайд есть на странице «Гайд для новичков».",
  },
  {
    question: "Подходит ли сервис для команды поддержки?",
    answer:
      "Да. Несколько операторов могут работать с одной панелью; каждый пользователь входит со своими ключами Telegram API. Сообщения из выбранных чатов попадают в ленту и Inbox.",
  },
];
