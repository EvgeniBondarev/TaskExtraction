import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { AppIcon3D } from "../components/AppIcon3D";
import { AppLogo } from "../components/AppLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeSwitch } from "../components/ThemeSwitch";
import { SeoHead } from "../components/SeoHead";
import { BRAND_NAMES, BrandMark, type Brand } from "../components/landing/BrandMark";
import { FeatureBento } from "../components/landing/FeatureBento";
import { LandingFaq } from "../components/landing/LandingFaq";
import { LandingHero } from "../components/landing/LandingHero";
import { MessagePlayground } from "../components/landing/MessagePlayground";
import { PrivacySplit } from "../components/landing/PrivacySplit";
import { Reveal } from "../components/landing/Reveal";
import { SetupSteps } from "../components/landing/SetupSteps";
import { JsonLdFaq } from "../components/seo/JsonLdFaq";
import { SITE } from "../config/site";
import { useI18n } from "../i18n";
import "../styles/landing.css";

const WELCOME_SEEN_KEY = "te_seen_welcome";
const CONTACT_URL = "https://t.me/Burn1ngSnow";
const STRIP: Brand[] = ["telegram", "jira", "trello", "github", "slack"];

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
  /** Оставлен для совместимости с App: на лендинге один CTA «Открыть панель». */
  onSkip?: () => void;
  onHome?: () => void;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LandingPage({ onTry, onHome }: Props) {
  const { messages, locale } = useI18n();
  const t = messages.landing;

  useEffect(() => {
    // /guide и старые ссылки /welcome#guide ведут к разделу подключения
    const hash = window.location.hash.replace("#", "");
    const target = hash === "guide" || window.location.pathname === "/guide" ? "setup" : hash;
    if (target) document.getElementById(target)?.scrollIntoView();
  }, []);

  const open = () => {
    markWelcomeSeen();
    onTry();
  };

  const navLinks = [
    { id: "example", label: t.nav.example },
    { id: "setup", label: t.nav.setup },
    { id: "faq", label: t.nav.faq },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="lnd">
        <SeoHead path={SITE.welcomePath} />
        <JsonLdFaq />

        <header className="lnd-nav">
          <div className="lnd-nav__inner lnd-wrap">
            <a
              href="/"
              className="lnd-nav__brand"
              title={t.nav.homeTitle}
              onClick={(e) => {
                e.preventDefault();
                onHome?.();
              }}
            >
              <AppLogo size={26} />
              <span className="lnd-nav__name">TaskExtraction</span>
            </a>
            <nav className="lnd-nav__links" aria-label={t.nav.aria}>
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(link.id);
                  }}
                >
                  {link.label}
                </a>
              ))}
              {locale !== "en" && (
            <>
              <a href="/features/">Возможности</a>
              <a href="/integrations/">Интеграции</a>
            </>
          )}
          <a href="/blog/">{t.nav.blog}</a>
            </nav>
            <div className="lnd-nav__end">
              <ThemeSwitch className="lnd-theme" />
              <LanguageSwitcher />
              <button type="button" className="lnd-btn lnd-btn--primary lnd-btn--sm" onClick={open}>
                {t.cta.open}
              </button>
            </div>
          </div>
        </header>

        <main>
          <LandingHero onOpen={open} onExample={() => scrollToId("example")} />

          <div className="lnd-strip lnd-wrap">
            <span className="lnd-strip__label">{t.strip.label}</span>
            <ul className="lnd-strip__logos">
              {STRIP.map((brand) => (
                <li key={brand} title={BRAND_NAMES[brand]}>
                  <BrandMark brand={brand} size={26} />
                </li>
              ))}
            </ul>
          </div>

          <section className="lnd-example lnd-wrap" id="example" aria-labelledby="lnd-example-title">
            <Reveal className="lnd-example__head">
              <h2 id="lnd-example-title">{t.playground.title}</h2>
              <p>{t.playground.lead}</p>
            </Reveal>
            <MessagePlayground />
          </section>

          <SetupSteps />
          <FeatureBento />
          <PrivacySplit />
          <LandingFaq />

          <section className="lnd-closing lnd-wrap" aria-labelledby="lnd-closing-title">
            <Reveal className="lnd-closing__inner">
              <AppIcon3D size={132} className="lnd-closing__icon" />
              <h2 id="lnd-closing-title">{t.closing.title}</h2>
              <p>{t.closing.lead}</p>
              <button type="button" className="lnd-btn lnd-btn--primary" onClick={open}>
                {t.cta.open}
              </button>
              <p className="lnd-closing__contact">
                {t.closing.contact}{" "}
                <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
                  @Burn1ngSnow
                </a>
              </p>
            </Reveal>
          </section>
        </main>

        <footer className="lnd-footer lnd-wrap">
          <span>
            © {new Date().getFullYear()} {t.footer.rights}
          </span>
          <a href="/blog/">{t.nav.blog}</a>
          <a href="/privacy/">{t.footer.privacy}</a>
        </footer>
      </div>
    </MotionConfig>
  );
}
