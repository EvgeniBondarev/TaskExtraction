import {
  ArrowSquareOut,
  ArrowsClockwise,
  Briefcase,
  CheckCircle,
  CircleNotch,
  Kanban,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchTelegramConnectLinks,
  fetchTelegramOnboardingStatus,
  refreshTelegramOnboardingStatus,
  fetchTelegramSources,
  telegramGroupAvatarUrl,
} from "../api/telegram";
import type { TelegramConnectLinks, TelegramOnboardingStatus, TelegramSources } from "../api/telegram";
import { useI18n } from "../i18n";
import { ImageLightbox } from "./ImageLightbox";
import { ImageWithSkeleton } from "./ImageWithSkeleton";

type Props = {
  variant: "dialog" | "settings";
  onClose?: () => void;
  userName?: string | null;
};

type TutorialShot = { src: string; alt: string; orientation: "wide" | "portrait" };

const GROUP_SHOTS: TutorialShot[] = [
  { src: "/onboarding/group-start.png", alt: "Шаг 1: запустите бота", orientation: "wide" },
  { src: "/onboarding/group-select.png", alt: "Шаг 2: выберите рабочую группу", orientation: "portrait" },
  { src: "/onboarding/group-confirm.png", alt: "Шаг 3: дождитесь подтверждения", orientation: "wide" },
];

const BUSINESS_SHOTS: TutorialShot[] = [
  { src: "/onboarding/business-settings.png", alt: "Шаг 1: откройте Telegram Business", orientation: "portrait" },
  { src: "/onboarding/business-chatbots.png", alt: "Шаг 2: откройте чат-ботов", orientation: "portrait" },
  { src: "/onboarding/business-permissions.png", alt: "Шаг 3: выдайте разрешения", orientation: "portrait" },
];

/**
 * A single source of truth for first-run and Settings connection guidance.
 * The server status is polled while a connection is incomplete so a successful
 * Telegram action is reflected without asking the user to reload the app.
 */
export function TelegramConnectionSetup({ variant, onClose, userName }: Props) {
  const { messages } = useI18n();
  const t = messages.panel.onboarding;
  const [sources, setSources] = useState<TelegramSources | null>(null);
  const [links, setLinks] = useState<TelegramConnectLinks | null>(null);
  const [status, setStatus] = useState<TelegramOnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<TutorialShot | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setChecking(true);
    try {
      const [nextSources, nextLinks, nextStatus] = await Promise.all([
        fetchTelegramSources(),
        fetchTelegramConnectLinks(),
        manual ? refreshTelegramOnboardingStatus() : fetchTelegramOnboardingStatus(),
      ]);
      setSources(nextSources);
      setLinks(nextLinks);
      setStatus(nextStatus);
      setError("");
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, [t.error]);

  useEffect(() => {
    // Reconcile once on opening Settings as old installations could have a
    // cached Business connection from before disconnect events were handled.
    void load(true);
  }, [load]);

  useEffect(() => {
    if (!status || (status.groups.length > 0 && status.business_connected)) return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load, status]);

  const groups = status?.groups ?? [];
  const isComplete = groups.length > 0 || Boolean(status?.business_connected);
  const welcome = userName ? t.welcomeNamed.replace("{name}", userName) : t.welcome;
  const content = (
    <>
      <header className="te-connect__head">
        <div className="te-connect__head-copy">
          {variant === "dialog" && (
            <p className="te-connect__welcome">
              <Sparkle size={15} weight="fill" aria-hidden />
              {welcome}
            </p>
          )}
          <span className="te-connect__eyebrow">{variant === "dialog" ? t.eyebrow : t.setupTitle}</span>
          <h2 id={variant === "dialog" ? "telegram-connect-title" : undefined}>
            {variant === "dialog" ? t.title : t.setupTitle}
          </h2>
          <p>{variant === "dialog" ? t.lead : t.setupLead}</p>
        </div>
        {variant === "dialog" && (
          <div className="te-connect__journey" aria-hidden="true">
            <span><UsersThree size={18} weight="duotone" /></span>
            <i />
            <span><Sparkle size={16} weight="fill" /></span>
            <i />
            <span><Kanban size={18} weight="duotone" /></span>
          </div>
        )}
      </header>

      {loading ? (
        <div className="te-connect__loading" role="status">
          <CircleNotch className="te-spin" size={24} aria-hidden />
          {t.checking}
        </div>
      ) : (
        <div className="te-connect__options">
          <section className={`te-connect__option${groups.length ? " is-connected" : ""}`}>
            <header>
              <span className="te-connect__icon" aria-hidden><UsersThree size={21} /></span>
              <span>
                <h3>{t.group.title}</h3>
                <p>{t.group.lead}</p>
              </span>
              {groups.length > 0 && <CheckCircle className="te-connect__check" size={24} weight="fill" aria-label={t.group.connected} />}
            </header>

            {groups.length > 0 ? (
              <ul className="te-connect__groups" aria-label={t.group.connected}>
                {groups.map((group) => {
                  const name = group.title || t.group.empty;
                  return (
                    <li key={group.source_id}>
                      {group.has_avatar ? (
                        <img src={telegramGroupAvatarUrl(group.source_id)} alt="" />
                      ) : (
                        <span className="te-connect__group-placeholder" aria-hidden>{name.slice(0, 1).toUpperCase()}</span>
                      )}
                      <span><strong>{name}</strong><small>{t.group.connected}</small></span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="te-connect__hint">{t.group.pending}</p>
            )}

            <details className="te-connect__tutorial" open>
              <summary>{t.group.stepsTitle}</summary>
              <ol>
                {t.group.steps.map((step, index) => (
                  <li key={step}>
                    <span>{index + 1}</span>{step}
                  </li>
                ))}
              </ol>
              <div className="te-connect__shots te-connect__shots--group">
                {GROUP_SHOTS.map((shot) => (
                  <button key={shot.src} type="button" className={`te-connect__shot te-connect__shot--${shot.orientation}`} onClick={() => setPreview(shot)}>
                    <ImageWithSkeleton src={shot.src} alt={shot.alt} loading="lazy" wrapperClassName="te-connect__shot-image" />
                  </button>
                ))}
              </div>
            </details>

            {sources?.bot_configured && links?.group && (
              <a className="te-btn te-btn--primary te-connect__action" href={links.group} target="_blank" rel="noreferrer">
                {t.group.action}<ArrowSquareOut size={16} aria-hidden />
              </a>
            )}
          </section>

          <section className={`te-connect__option${status?.business_connected ? " is-connected" : ""}`}>
            <header>
              <span className="te-connect__icon" aria-hidden><Briefcase size={21} /></span>
              <span>
                <h3>{t.business.title}</h3>
                <p>{t.business.lead}</p>
              </span>
              {status?.business_connected && <CheckCircle className="te-connect__check" size={24} weight="fill" aria-label={t.business.connected} />}
            </header>

            {status?.business_connected ? (
              <div className="te-connect__business-account">
                <span aria-hidden>{(status.business_account?.title || t.business.accountFallback).slice(0, 1).toUpperCase()}</span>
                <p>
                  <strong>{status.business_account?.title || t.business.accountFallback}</strong>
                  <small><CheckCircle size={15} weight="fill" aria-hidden />{t.business.connected}</small>
                </p>
              </div>
            ) : (
              <>
                <p className="te-connect__hint">{status?.business_paired ? t.business.paired : t.business.pending}</p>
                <details className="te-connect__tutorial" open>
                  <summary>{t.business.stepsTitle}</summary>
                  <ol>
                    {t.business.steps.map((step, index) => (
                      <li key={step}>
                        <span>{index + 1}</span>{step}
                      </li>
                    ))}
                  </ol>
                  <div className="te-connect__shots">
                    {BUSINESS_SHOTS.map((shot) => (
                    <button key={shot.src} type="button" className={`te-connect__shot te-connect__shot--${shot.orientation}`} onClick={() => setPreview(shot)}>
                      <ImageWithSkeleton src={shot.src} alt={shot.alt || t.tutorialAlt} loading="lazy" wrapperClassName="te-connect__shot-image" />
                      </button>
                    ))}
                  </div>
                </details>
                <p className="te-connect__waiting"><CircleNotch className="te-spin" size={14} aria-hidden />{t.business.waiting}</p>
              </>
            )}

            {sources?.bot_configured && links?.business && !status?.business_connected && (
              <a className="te-btn te-btn--primary te-connect__action" href={links.business} target="_blank" rel="noreferrer">
                {t.business.action}<ArrowSquareOut size={16} aria-hidden />
              </a>
            )}
            {!sources?.bot_configured && <p className="te-alert te-alert--warn">{messages.panel.settings.telegram.botMissing}</p>}
          </section>
        </div>
      )}

      {error && <p className="te-alert te-alert--error">{error}</p>}
      <footer className="te-connect__footer">
        <button type="button" className="te-btn te-btn--ghost" onClick={() => void load(true)} disabled={checking}>
          <ArrowsClockwise size={16} className={checking ? "te-spin" : undefined} aria-hidden />
          {checking ? t.checking : t.check}
        </button>
        {variant === "dialog" && onClose && (
          <button type="button" className="te-btn te-btn--primary" onClick={onClose}>
            {isComplete ? t.done : t.close}
          </button>
        )}
      </footer>
    </>
  );

  if (variant === "settings") return <>
    <section className="te-connect te-connect--settings">{content}</section>
    {preview && <ImageLightbox src={preview.src} alt={preview.alt} onClose={() => setPreview(null)} />}
  </>;

  return (
    <div className="te-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="telegram-connect-title">
      <div className="te-dialog-backdrop" onClick={onClose} />
      <div className="te-dialog te-dialog--connect">{content}</div>
      {preview && <ImageLightbox src={preview.src} alt={preview.alt} onClose={() => setPreview(null)} />}
    </div>
  );
}
