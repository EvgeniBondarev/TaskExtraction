import { useEffect, type ReactNode } from "react";
import { AppLogo } from "../components/AppLogo";
import { BeginnerGuide } from "../components/landing/BeginnerGuide";
import { FlowDiagram } from "../components/landing/FlowDiagram";
import { IntegrationFeatureList } from "../components/landing/IntegrationFeatureList";
import { IntegrationsHubVisual } from "../components/landing/IntegrationsHubVisual";
import {
  FeedIllustration,
  HeroIllustration,
  KanbanIllustration,
  RealtimeIllustration,
} from "../components/landing/LandingIllustrations";
import "../styles/landing.css";

const WELCOME_SEEN_KEY = "te_seen_welcome";

export function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

interface Props {
  onTry: () => void;
  onSkip?: () => void;
}

type FeatureBlock = {
  tag: string;
  tagClass: string;
  title: string;
  body: string;
  bullets?: string[];
  customList?: ReactNode;
  visual: ReactNode;
  reverse: boolean;
};

const FEATURES: FeatureBlock[] = [
  {
    tag: "Извлечение",
    tagClass: "lp-feature-tag--blue",
    title: "Задачи из переписки Telegram",
    body: "Сервис читает выбранные чаты и передаёт текст в LLM. Модель определяет, содержит ли сообщение поручение, и при необходимости создаёт карточку в панели.",
    bullets: [
      "Настраиваемый промпт под формулировки вашей команды",
      "OpenAI-совместимый API (ключ и endpoint в настройках)",
      "Обработка входящих сообщений без ручного копирования",
    ],
    visual: <HeroIllustration />,
    reverse: false,
  },
  {
    tag: "Канбан",
    tagClass: "lp-feature-tag--violet",
    title: "Учёт статусов на доске",
    body: "Колонки Inbox, В работе, Готово и Архив. Статус меняется из интерфейса; в карточке сохраняются описание, автор и ссылка на сообщение в Telegram.",
    bullets: [
      "Единая доска для всех извлечённых задач",
      "Привязка к чату и отправителю",
      "Детальный просмотр и редактирование в модальном окне",
    ],
    visual: <KanbanIllustration />,
    reverse: true,
  },
  {
    tag: "Лента",
    tagClass: "lp-feature-tag--green",
    title: "Хронология сообщений",
    body: "Раздел «Лента» показывает поток входящих сообщений с меткой классификации. Удобно сверять контекст переписки и созданные задачи.",
    bullets: [
      "Поиск по тексту сообщений",
      "Просмотр вложений, в том числе в полноэкранном режиме",
      "Индикаторы связанных тикетов во внешних системах",
    ],
    visual: <FeedIllustration />,
    reverse: false,
  },
  {
    tag: "Интеграции",
    tagClass: "lp-feature-tag--amber",
    title: "Синхронизация с внешними системами",
    body: "После создания задачи данные можно автоматически передать в подключённые сервисы. Параметры и режим auto-push задаются в разделе «Настройки → Интеграции».",
    customList: <IntegrationFeatureList />,
    visual: <IntegrationsHubVisual />,
    reverse: true,
  },
  {
    tag: "События",
    tagClass: "lp-feature-tag--pink",
    title: "Обновления в реальном времени",
    body: "Подключение по WebSocket: новые сообщения и задачи отображаются без перезагрузки страницы. Всплывающие уведомления позволяют быстро перейти в ленту.",
    bullets: [
      "Статус обработки сообщения на карточке в ленте",
      "Переход к сообщению по клику на уведомление",
      "Периодическое обновление данных в фоне",
    ],
    visual: <RealtimeIllustration />,
    reverse: false,
  },
];

export function LandingPage({ onTry, onSkip }: Props) {
  useEffect(() => {
    if (window.location.hash === "#guide") {
      document.getElementById("guide")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleTry = () => {
    markWelcomeSeen();
    onTry();
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp-page">
      <header className="lp-nav">
        <a href="/welcome" className="lp-nav-brand" onClick={(e) => e.preventDefault()}>
          <AppLogo size={28} />
          TaskExtraction
        </a>
        <nav className="lp-nav-links" aria-label="Навигация">
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>
            Возможности
          </a>
          <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>
            Как работает
          </a>
          <a href="#guide" onClick={(e) => { e.preventDefault(); scrollTo("guide"); }}>
            Гайд
          </a>
          <a
            href="https://t.me/Burn1ngSnow"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-nav-tg"
          >
            Контакт
          </a>
          {onSkip && (
            <button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={onSkip}>
              В приложение
            </button>
          )}
          <button type="button" className="lp-btn lp-btn--primary lp-btn--sm" onClick={handleTry}>
            Попробовать
          </button>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <span className="lp-hero-badge">Панель для команд поддержки</span>
          <h1>
            Задачи из Telegram — <span>в одной панели</span>
          </h1>
          <p className="lp-hero-lead">
            TaskExtraction подключается к рабочим чатам, извлекает поручения через LLM и ведёт учёт
            в канбане. Поддерживается выгрузка в Jira, Trello, GitHub Issues и Slack.
          </p>
          <div className="lp-hero-actions">
            <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={handleTry}>
              Попробовать
            </button>
            <button
              type="button"
              className="lp-btn lp-btn--ghost lp-btn--lg"
              onClick={() => scrollTo("guide")}
            >
              Гайд для новичков
            </button>
          </div>
        </div>
        <div className="lp-hero-visual" aria-hidden>
          <HeroIllustration />
        </div>
      </section>

      <div className="lp-stats">
        <div className="lp-stat">
          <strong>4</strong>
          <span>колонки канбана</span>
        </div>
        <div className="lp-stat">
          <strong>4+</strong>
          <span>интеграции</span>
        </div>
        <div className="lp-stat">
          <strong>∞</strong>
          <span>чатов Telegram</span>
        </div>
        <div className="lp-stat">
          <strong>~20</strong>
          <span>мин до старта</span>
        </div>
      </div>

      <section className="lp-section" id="how">
        <div className="lp-section-head lp-section-head--center">
          <span className="lp-badge">Схема</span>
          <h2>Как устроен процесс</h2>
          <p className="lp-section-lead">
            Цепочка от входящего сообщения до записи во внешней системе — четыре этапа, без ручного
            переноса текста между сервисами.
          </p>
        </div>
        <FlowDiagram />
      </section>

      <section className="lp-section" id="features">
        <div className="lp-section-head lp-section-head--center">
          <span className="lp-badge">Функции</span>
          <h2>Что входит в продукт</h2>
          <p className="lp-section-lead">
            Основные разделы панели и сценарии, для которых предназначен сервис.
          </p>
        </div>

        {FEATURES.map((f) => (
          <article
            key={f.title}
            className={`lp-feature${f.reverse ? " lp-feature--reverse" : ""}`}
          >
            <div className="lp-feature-copy">
              <span className={`lp-feature-tag ${f.tagClass}`}>{f.tag}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              {f.customList ?? (
                <ul>
                  {f.bullets?.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="lp-feature-visual">{f.visual}</div>
          </article>
        ))}
      </section>

      <BeginnerGuide onTry={handleTry} />

      <section className="lp-contact" id="contact">
        <div className="lp-contact-inner">
          <div className="lp-contact-text">
            <h2>Вопросы по настройке и использованию</h2>
            <p>
              Напишите в Telegram — помогу с подключением чатов, LLM и интеграций.
            </p>
          </div>
          <a
            href="https://t.me/Burn1ngSnow"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-contact-tg"
          >
            <TelegramMark />
            <span>
              <strong>@Burn1ngSnow</strong>
              <small>Открыть в Telegram</small>
            </span>
          </a>
        </div>
      </section>

      <footer className="lp-footer-cta">
        <h2>Запустить панель</h2>
        <p>Пройдите мастер настройки: ключи API, вход в Telegram, выбор чатов.</p>
        <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={handleTry}>
          Попробовать
        </button>
        <p className="lp-footer-note">Развёртывание через Docker · данные хранятся локально</p>
      </footer>
    </div>
  );
}

function TelegramMark() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        d="M5.5 11.8l11.2-4.3c.5-.2 1 .1.8.9l-1.9 9c-.1.5-.4.6-.8.4l-2.2-1.6-1.1 1.1c-.1.1-.3.2-.5.2l.2-3.1 8.1-7.3c.1-.1 0-.2-.1-.1L9.6 13.5l-3.3 1.1c-.4.1-.4.4.1.5l.8.3 1.6.5 3.8 1.2c.5.2 1 .1.8-.9z"
        fill="#fff"
      />
    </svg>
  );
}
