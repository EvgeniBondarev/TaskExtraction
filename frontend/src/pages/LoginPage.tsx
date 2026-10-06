import { ArrowLeft, CheckCircle, GoogleLogo, Kanban, ShieldCheck, TelegramLogo } from "@phosphor-icons/react";
import { motion, MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { fetchGoogleAuthStatus, startGoogleLogin } from "../api/auth";
import { AppIcon3D } from "../components/AppIcon3D";
import { AppLogo } from "../components/AppLogo";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { SeoHead } from "../components/SeoHead";
import { ThemeSwitch } from "../components/ThemeSwitch";
import { useI18n } from "../i18n";

type ErrorCode = "cancelled" | "expired" | "google" | "unavailable";

interface Props {
  onHome: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

function readError(): ErrorCode | null {
  const code = new URLSearchParams(window.location.search).get("error");
  return code === "cancelled" || code === "expired" || code === "google" || code === "unavailable" ? code : null;
}

/** Страница входа: объясняет, что произойдёт и какие данные получит сервис, затем ведёт в Google OAuth. */
export function LoginPage({ onHome }: Props) {
  const { messages } = useI18n();
  const t = messages.panel.login;
  const [error, setError] = useState<ErrorCode | null>(readError);
  const [configured, setConfigured] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetchGoogleAuthStatus()
      .then((s) => {
        setConfigured(s.configured);
        if (!s.configured) setError("unavailable");
      })
      .catch(() => {});
  }, []);

  const signIn = () => {
    setRedirecting(true);
    startGoogleLogin();
  };

  const item = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.06 * i, ease: EASE },
  });

  return (
    <MotionConfig reducedMotion="user">
      <SeoHead noindex useLocaleMeta={false} path="/login" />
      <div className="te-theme te-app te-login">
        <header className="te-login__nav">
          <a
            href="/welcome"
            className="te-login__brand"
            onClick={(e) => {
              e.preventDefault();
              onHome();
            }}
          >
            <AppLogo size={28} />
            <span>TaskExtraction</span>
          </a>
          <span className="te-login__tools">
            <ThemeSwitch />
            <LanguageSwitcher className="lang-switch--compact" />
          </span>
        </header>

        <main className="te-login__main">
          <section className="te-login__story">
            <motion.div className="te-login__story-mark" {...item(0)}>
              <AppIcon3D size={74} />
              <div className="te-login__workflow" aria-hidden="true">
                <img src="/landing/premium/login-workflow.png" alt="" width="1152" height="1536" />
                <span className="te-login__workflow-icon te-login__workflow-icon--google"><GoogleLogo size={15} weight="bold" /></span>
                <span className="te-login__workflow-icon te-login__workflow-icon--telegram"><TelegramLogo size={15} weight="fill" /></span>
                <span className="te-login__workflow-icon te-login__workflow-icon--kanban"><Kanban size={15} weight="bold" /></span>
              </div>
            </motion.div>
            <motion.h1 {...item(1)}>{t.title}</motion.h1>
            <motion.p className="te-login__lead" {...item(2)}>
              {t.lead}
            </motion.p>
          </section>

          <motion.section
            className="te-login__card te-glass"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          >
            <div className="te-login__card-title">
              <span className="te-login__card-mark" aria-hidden="true"><ShieldCheck size={19} weight="fill" /></span>
              <h2>{t.cardTitle}</h2>
            </div>

            {error && (
              <p className="te-alert te-alert--error" role="alert">
                {t.errors[error]}
              </p>
            )}

            <button
              type="button"
              className="te-btn te-btn--primary te-login__google"
              onClick={signIn}
              disabled={!configured || redirecting}
            >
              <GoogleLogo size={20} weight="bold" aria-hidden />
              {redirecting ? t.redirecting : t.google}
            </button>

            <ul className="te-login__access">
              {t.access.map((line, i) => (
                <li key={line}>
                  {i === 0 ? (
                    <ShieldCheck size={18} weight="fill" aria-hidden />
                  ) : (
                    <CheckCircle size={18} weight="fill" aria-hidden />
                  )}
                  {line}
                </li>
              ))}
            </ul>

            <p className="te-login__consent">
              {t.consentBefore} <a href="/privacy">{t.consentLink}</a>.
            </p>
          </motion.section>
          <motion.div className="te-login__steps" {...item(3)}>
            <span className="te-field__label">{t.stepsTitle}</span>
            <ol className="te-steps">
              {t.steps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span>{step.body}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </main>

        <footer className="te-login__foot">
          <button type="button" className="te-btn te-btn--quiet te-btn--sm" onClick={onHome}>
            <ArrowLeft size={16} aria-hidden />
            {t.back}
          </button>
        </footer>
      </div>
    </MotionConfig>
  );
}
