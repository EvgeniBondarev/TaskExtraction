import type { Messages } from "../types";
import { landingRu } from "./landing.ru";
import { panelRu } from "./panel.ru";
import { privacyRu } from "./privacy.ru";
import { settingsRu } from "./settings.ru";

const messages: Messages = {
  meta: {
    title: "TaskExtraction: задачи из Telegram на одной доске",
    description:
      "Бот читает рабочие группы Telegram, находит поручения без тегов и команд и ведёт их на канбан-доске. Выгрузка в Jira, Trello, GitHub Issues и Slack.",
    shareTitle: "TaskExtraction: задачи из Telegram на одной доске",
    shareDescription:
      "Бот находит поручения в рабочих чатах Telegram и заводит карточки на доске. Ответы о статусе в чат, выгрузка в Jira, Trello, GitHub и Slack.",
    keywords:
      "telegram задачи, извлечение задач, kanban, jira, trello, slack, github issues, llm, поддержка, taskextraction, ai task manager",
    ogImageAlt: "TaskExtraction: задачи из Telegram на одной доске",
    locale: "ru_RU",
  },
  lang: { label: "Язык", ru: "RU", en: "EN" },
  nav: {
    home: "Главная",
    homeTitle: "На главную",
    features: "Возможности",
    how: "Как работает",
    guide: "Гайд",
    faq: "FAQ",
    contact: "Контакт",
    toApp: "В приложение",
    try: "Попробовать",
    mainNav: "Навигация",
    tasks: "Задачи",
    feed: "Лента",
    settings: "Настройки",
    about: "О сервисе",
    aboutProduct: "О продукте",
    logout: "Выйти",
    logoutTitle: "Выйти из аккаунта",
    logoutPanel: "Выйти из панели",
    logoutPanelTitle: "Сбросить сессию панели (данные сохранятся)",
    tasksUnread: "Задачи, есть непрочитанные",
    feedUnread: "Лента, есть непрочитанные",
    tasksNew: "новых",
    feedNew: "новых",
  },
  landing: landingRu,
  panel: panelRu,
  faq: {
    items: [
      {
        question: "Что такое TaskExtraction?",
        answer:
          "Веб-панель для команд, которые принимают поручения в Telegram. Бот читает рабочие группы, модель находит в сообщениях задачи, а панель ведёт их на канбан-доске и отправляет в Jira, Trello, GitHub Issues или Slack.",
      },
      {
        question: "Нужно ли писать хештеги или команды боту?",
        answer:
          "Нет. Люди пишут как обычно: «проверьте доставку», «не открывается корзина». Модель сама решает, задача это, вопрос или переписка не по работе.",
      },
      {
        question: "Нужен ли доступ к моему аккаунту Telegram?",
        answer:
          "Нет. В панель входят через Google. Сообщения приходят через бота: из групп, куда вы его добавили, и из личных чатов, разрешённых в Telegram Business. Номер телефона и QR-код не нужны.",
      },
      {
        question: "Как бот сообщает о статусе задачи?",
        answer:
          "Когда карточка переходит в «В работе» или «Готово», бот отвечает на исходное сообщение в чате. Эти ответы можно отключить в настройках. Из карточки также можно написать ответ, он уйдёт в чат со ссылкой на задачу.",
      },
      {
        question: "Какие интеграции поддерживаются?",
        answer:
          "Jira, Trello, GitHub Issues и Slack. Для каждой можно включить автоматическую отправку новых задач или отправлять их кнопкой из карточки.",
      },
      {
        question: "Где хранятся данные?",
        answer:
          "У каждого пользователя отдельная база, медиа и настройки. Токены интеграций шифруются. Сервис можно развернуть на своём сервере через Docker, тогда данные не покидают ваш volume.",
      },
    ],
  },
  app: {
    chatsTitle: "Чаты для отслеживания",
    chatsLead:
      "Выберите чаты, из которых TaskExtraction будет получать сообщения в реальном времени.",
    chatsSubmit: "Начать отслеживание",
    chatLoadTitle: "Загружаем чаты из Telegram",
    chatLoadTitleSync: "Обновляем список чатов",
    chatLoadHint:
      "Если у вас много групп и каналов, загрузка может занять до минуты — это нормально.",
    chatLoadFootnote: "Не закрывайте страницу — идёт синхронизация с Telegram",
    chatLoadPreviewSub: "Загрузка…",
    chatLoadSteps: [
      "Подключаемся к Telegram…",
      "Получаем список групп и каналов…",
      "Загружаем названия и аватары…",
      "Обрабатываем последние чаты…",
      "Почти готово…",
    ],
    intEyebrow: "Telegram подключён",
    intTitle: "Куда отправлять задачи?",
    intLead:
      "Подключите готовые интеграции: новые задачи из чатов можно автоматически создавать в трекерах или дублировать в Slack.",
    intSteps: [
      "Jira — задачи и проекты…",
      "Trello — доски и карточки…",
      "GitHub — issues в репозитории…",
      "Slack — уведомления в канал…",
      "Можно подключить всё или только нужное…",
    ],
    intFootnote: "Интеграции всегда доступны в разделе «Настройки»",
    intSetup: "Настроить интеграции",
    intSkip: "Позже",
  },
  kanban: {
    inbox: "Новые",
    inProgress: "В работе",
    done: "Готово",
    archive: "Архив",
  },
  feed: {
    pageTitle: "Лента",
    pageLead: "Все сообщения из подключённых чатов в реальном времени. Модель отмечает, где поручение.",
    statsAria: "Статистика ленты",
    statMessages: "сообщений",
    statCandidates: "можно в задачи",
    connectedChats: "Подключённые чаты",
    connectedChatsHint: "Сообщения из этих чатов появятся в ленте автоматически.",
    searchPlaceholder: "Поиск по тексту, автору, чату…",
    searchAria: "Поиск в ленте",
    searchClear: "Очистить поиск",
    searchMeta: "Показано {shown} из {total}",
    emptyNoMessages: "Пока нет сообщений",
    emptyNoMessagesHint:
      "Добавьте бота в рабочую группу в настройках и напишите туда сообщение. Оно появится здесь через пару секунд.",
    emptyNoResults: "Ничего не найдено",
    emptyNoResultsHint: "Нет совпадений по «{query}»",
    newPill: "новое",
    unknownUser: "Пользователь",
    mediaNoText: "Медиа без текста",
    openTelegram: "Открыть в Telegram",
    creatingTask: "Создаём…",
    createTask: "Создать задачу",
    loadingSkeleton: "Загрузка ленты",
  },
  auth: {
    title: "Вход через Telegram",
    lead: "Отсканируйте QR-код в Telegram — сообщения обрабатываются только в выбранных чатах.",
    consentLabel:
      "Я подключаю свой аккаунт Telegram и соглашаюсь на обработку сообщений в выбранных чатах поддержки в соответствии с",
    consentRequired: "Подтвердите согласие, чтобы продолжить",
    saveCredentialsFirst:
      "Сначала сохраните api_id и api_hash с my.telegram.org/apps (или задайте TELEGRAM_API_ID и TELEGRAM_API_HASH в .env бэкенда)",
    privacyLink: "политикой конфиденциальности",
    qrHint: "Telegram → Настройки → Устройства → Подключить устройство",
    qrScanNote:
      "Отсканируйте QR камерой в приложении Telegram. Ссылку открывать не нужно — в части версий она не работает.",
    qrExpired: "QR-код истёк",
    showQr: "Показать QR-код",
    refreshQr: "Обновить QR",
    consentHint: "Отметьте согласие выше, чтобы получить QR-код",
    phoneTab: "Телефон",
    phoneHint:
      "Код приходит в приложение Telegram (чат «Telegram»), не в SMS. На этом номере должен быть установлен и открыт Telegram.",
    phoneCodeHint: "Код из чата «Telegram» в приложении",
    phone2faHint: "Введите облачный пароль двухфакторной аутентификации",
    phoneSendCode: "Получить код",
    phoneResendCode: "Отправить код повторно",
    phoneInvalid: "Введите полный международный номер (например +375299785592)",
    phoneOtherNumber: "← Другой номер",
    qrTab: "QR-код",
  },
  privacy: privacyRu,
  settings: settingsRu,
};

export default messages;
