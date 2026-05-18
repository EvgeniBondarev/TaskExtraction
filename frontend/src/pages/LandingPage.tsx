import { useEffect } from "react";
import { AppLogo } from "../components/AppLogo";
import { SeoHead } from "../components/SeoHead";
import { BeginnerGuide } from "../components/landing/BeginnerGuide";
import { LandingFaq } from "../components/landing/LandingFaq";
import { JsonLdFaq } from "../components/seo/JsonLdFaq";
import { FlowDiagram } from "../components/landing/FlowDiagram";
import { HeroIllustration } from "../components/landing/LandingIllustrations";
import { LandingProductCase } from "../components/landing/LandingProductCase";
import { LandingScrollVideo } from "../components/landing/LandingScrollVideo";
import { LandingStats } from "../components/landing/LandingStats";
import { ScrollReveal } from "../components/landing/ScrollReveal";
import { SITE } from "../config/site";
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
  onHome?: () => void;
}

export function LandingPage({ onTry, onSkip, onHome }: Props) {
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
      <SeoHead path={SITE.welcomePath} />
      <JsonLdFaq />

      <header className="lp-nav">
        <a
          href="/"
          className="lp-nav-brand"
          onClick={(e) => {
            e.preventDefault();
            onHome?.();
          }}
          title="На главную"
        >
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
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo("faq"); }}>
            FAQ
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
        <ScrollReveal className="lp-hero-copy" immediate direction="up">
          <p className="lp-hero-slogan">Пиши в Telegram — выполняй везде</p>
          <h1>
            Задачи из Telegram — <span>в одной панели</span>
          </h1>
          <p className="lp-hero-lead">
            TaskExtraction подключается к рабочим чатам, извлекает поручения из обычных сообщений через
            LLM — без тегов и спецслов — и ведёт учёт в канбане. Выгрузка в Jira, Trello, GitHub Issues
            и Slack.
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
        </ScrollReveal>
        <ScrollReveal className="lp-hero-visual" immediate direction="scale" delay={120}>
          <HeroIllustration />
        </ScrollReveal>
      </section>

      <LandingStats />

      <section className="lp-section" id="how">
        <ScrollReveal className="lp-section-head lp-section-head--center">
          <span className="lp-badge">Схема</span>
          <h2>Как устроен процесс</h2>
          <p className="lp-section-lead">
            Цепочка от входящего сообщения до записи во внешней системе — четыре этапа, без ручного
            переноса текста между сервисами.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <FlowDiagram />
        </ScrollReveal>
      </section>

      <LandingScrollVideo />

      <section className="lp-section" id="features">
        <LandingProductCase />
      </section>

      <BeginnerGuide onTry={handleTry} />

      <LandingFaq />

      <ScrollReveal as="section" className="lp-contact" id="contact" direction="up">
        <div className="lp-contact-inner">
          <div className="lp-contact-text">
            <h2>Вопросы по настройке и использованию</h2>
            <p>Напишите в Telegram — помогу с подключением чатов, LLM и интеграций.</p>
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
      </ScrollReveal>

      <ScrollReveal as="footer" className="lp-footer-cta" direction="scale">
        <h2>Запустить панель</h2>
        <p>Пройдите мастер настройки: ключи API, вход в Telegram, выбор чатов.</p>
        <button type="button" className="lp-btn lp-btn--primary lp-btn--lg" onClick={handleTry}>
          Попробовать
        </button>
        <nav className="lp-footer-links" aria-label="Разделы страницы">
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>
            Возможности
          </a>
          <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>
            Как работает
          </a>
          <a href="#guide" onClick={(e) => { e.preventDefault(); scrollTo("guide"); }}>
            Гайд
          </a>
          <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo("faq"); }}>
            FAQ
          </a>
        </nav>
        <p className="lp-footer-note">Развёртывание через Docker · данные хранятся локально</p>
      </ScrollReveal>
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
