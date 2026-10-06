export type PricingPlan = {
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  cta: string;
  ctaHref: string;
  featured?: boolean;
  featuresTitle: string;
  features: string[];
};

export const PRICING_PATH = "/pricing/";

export const PRICING_PAGE = {
  path: PRICING_PATH,
  title: "Цены TaskExtraction — бесплатный сервис для задач из Telegram",
  description: "TaskExtraction бесплатный: без подписок, тарифов и банковской карты. Все функции — ИИ-извлечение задач, канбан, Jira, Trello, GitHub и Slack — доступны сразу.",
  h1: "Всё бесплатно",
  lead: "Без тарифов, подписок и банковской карты. Войдите через Google, подключите рабочий чат и получайте задачи из Telegram на доске.",
  badge: "0 ₽ · без карты · без пробного периода",
} as const;

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Облако",
    tagline: "Начните за пару минут",
    price: "0 ₽",
    priceNote: "Бесплатно для всех, без пробного периода",
    cta: "Начать бесплатно",
    ctaHref: "/login",
    featured: true,
    featuresTitle: "Что входит:",
    features: [
      "Вход через Google, без Telegram-аккаунта и телефона",
      "Бот в рабочих группах и Telegram Business",
      "ИИ находит поручения и отличает их от обычной переписки",
      "Канбан-доска: новые, в работе, готово, архив",
      "Ответ в исходный Telegram-чат из карточки задачи",
      "Jira, Trello, GitHub Issues и Slack",
    ],
  },
  {
    name: "Своя установка",
    tagline: "Данные на вашем сервере",
    price: "0 ₽",
    priceNote: "Открытый Docker-образ, лицензия MIT",
    cta: "Образ на Docker Hub",
    ctaHref: "https://hub.docker.com/r/bondarevevgeni/taskextraction",
    featuresTitle: "То же самое, плюс:",
    features: [
      "Один контейнер: nginx и FastAPI",
      "SQLite на вашем диске, ничего не уходит на сторону",
      "Свой ключ для языковой модели",
      "Секреты хранятся в базе в зашифрованном виде",
    ],
  },
];

export const PRICING_FAQ: Array<{ q: string; a: string }> = [
  { q: "TaskExtraction правда бесплатный?", a: "Да. Платных тарифов и подписок нет, все функции доступны сразу после входа." },
  { q: "Нужна ли банковская карта?", a: "Нет. Вход выполняется через Google, платёжные данные не запрашиваются." },
  { q: "Чем отличается облачная версия от своей установки?", a: "Функции одинаковые. В облаке ничего устанавливать не нужно, а при своей установке сервис и данные работают на вашем сервере." },
  { q: "Нужно ли платить за Jira, Trello, GitHub и Slack?", a: "TaskExtraction не берёт плату за интеграции. Тарифы самих сервисов определяются их правилами." },
  { q: "Что с данными?", a: "Каждая рабочая область изолирована, а интеграции подключаются только по вашему выбору. Подробности в политике конфиденциальности." },
];
