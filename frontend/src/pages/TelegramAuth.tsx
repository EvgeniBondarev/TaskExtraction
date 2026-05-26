import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchTelegramStatus,
  MY_TELEGRAM_APPS_URL,
  pollQrStatus,
  refreshQrLogin,
  saveTelegramCredentials,
  startQrLogin,
  TelegramStatus,
} from "../api/telegram";
import { SetupStepper, SetupStepItem } from "../components/SetupStepper";
import { TelegramLogo } from "../components/TelegramLogo";
import "../styles/telegram-auth.css";
import { trackAnalyticsEvent } from "../api/analytics";
import { useI18n } from "../i18n";
import { isHostedMode, useHostedApp } from "../hooks/useHostedApp";
import { hasTelegramConsent, setTelegramConsent } from "../utils/telegramConsent";
import { telegramQrImageUrl } from "../utils/telegramQrImage";

type Step = "credentials" | "auth" | "done";

const STANDALONE_STEPS: SetupStepItem[] = [
  { id: "credentials", label: "Ключи", description: "API приложения" },
  { id: "auth", label: "Вход", description: "Аккаунт" },
  { id: "done", label: "Готово", description: "Подключено" },
];

interface Props {
  onComplete?: () => void;
  embedded?: boolean;
  /** Только вход (ключи уже сохранены на странице настроек) */
  wizard?: boolean;
}

export function TelegramAuth({ onComplete, embedded, wizard }: Props) {
  const { messages: i18n } = useI18n();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [consent, setConsent] = useState(() => hasTelegramConsent());
  const [consentError, setConsentError] = useState(false);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const serverHosted = useHostedApp();
  const isHostedFlow = isHostedMode(serverHosted, status?.hosted_app);
  const [step, setStep] = useState<Step>("credentials");
  const [qrLoginId, setQrLoginId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(0);
  const [qrExpired, setQrExpired] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const stopPollRef = useRef<(() => void) | null>(null);
  const wasCompleteRef = useRef(false);
  const trackedLoginRef = useRef(false);
  const trackedSetupRef = useRef(false);
  const qrAutoStarted = useRef(false);

  const refresh = useCallback(async () => {
    const s = await fetchTelegramStatus();
    setStatus(s);
    if (s.is_authorized && !trackedLoginRef.current) {
      trackedLoginRef.current = true;
      void trackAnalyticsEvent("login", s.user_id ?? s.api_id);
      if (s.hosted_app) {
        void trackAnalyticsEvent("registration", s.user_id ?? undefined);
      }
    }
    if (s.setup_complete) {
      setStep("done");
      if (!trackedSetupRef.current) {
        trackedSetupRef.current = true;
        void trackAnalyticsEvent("setup_complete", s.user_id ?? s.api_id);
      }
      if (!wasCompleteRef.current) {
        wasCompleteRef.current = true;
        onComplete?.();
      }
    } else {
      wasCompleteRef.current = false;
      if (s.hosted_app || serverHosted === true || s.has_credentials) {
        setStep("auth");
        if (s.api_id) setApiId(String(s.api_id));
      } else if (serverHosted === false) {
        setStep("credentials");
      }
    }
  }, [onComplete, serverHosted]);

  useEffect(() => {
    refresh().catch(() => setError("Не удалось связаться с API"));
    return () => stopPollRef.current?.();
  }, [refresh]);

  useEffect(() => {
    if (qrCountdown <= 0) return;
    const t = setInterval(() => {
      setQrCountdown((c) => {
        if (c <= 1) {
          setQrExpired(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [qrCountdown]);

  const requireConsent = useCallback(() => {
    if (consent || !isHostedFlow) return true;
    setConsentError(true);
    setError(i18n.auth.consentRequired);
    return false;
  }, [consent, isHostedFlow, i18n.auth.consentRequired]);

  const onConsentChange = (checked: boolean) => {
    setConsent(checked);
    setConsentError(false);
    if (checked) {
      setTelegramConsent();
      setError("");
      qrAutoStarted.current = false;
    }
  };

  const startQr = useCallback(async () => {
    if (!requireConsent()) return;
    setError("");
    setInfo("");
    stopPollRef.current?.();
    setLoading(true);
    try {
      const res = await startQrLogin();
      if (res.already_authorized) {
        stopPollRef.current?.();
        setQrUrl(null);
        setQrLoginId(null);
        await refresh();
        setLoading(false);
        return;
      }
      setQrLoginId(res.login_id);
      setQrUrl(res.url);
      setQrExpired(false);
      setQrCountdown(res.expires_in ?? 25);
      stopPollRef.current = pollQrStatus(res.login_id, async (s) => {
        if (s.status === "authorized") {
          stopPollRef.current?.();
          setQrUrl(null);
          setQrLoginId(null);
          setQrExpired(false);
          await refresh();
          setLoading(false);
        } else if (s.status === "token_expired" || s.status === "expired") {
          setQrExpired(true);
          setQrCountdown(0);
          setError("");
          setInfo(s.message || i18n.auth.qrExpired);
          setLoading(false);
        }
      });
      setLoading(false);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const needsCreds =
        /credentials not configured/i.test(raw) || /api_id|api_hash/i.test(raw);
      setError(needsCreds ? i18n.auth.saveCredentialsFirst : raw || "Ошибка QR");
      setLoading(false);
    }
  }, [refresh, requireConsent, i18n.auth.qrExpired, i18n.auth.saveCredentialsFirst]);

  useEffect(() => {
    if (
      isHostedFlow &&
      !qrUrl &&
      !status?.is_authorized &&
      !qrAutoStarted.current &&
      consent
    ) {
      qrAutoStarted.current = true;
      void startQr();
    }
  }, [isHostedFlow, qrUrl, status?.is_authorized, startQr, consent]);

  const saveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!apiId.trim() || !apiHash.trim()) {
      setError("Укажите api_id и api_hash с my.telegram.org/apps");
      return;
    }
    setLoading(true);
    try {
      const savedApiId = Number(apiId);
      await saveTelegramCredentials({
        api_id: savedApiId,
        api_hash: apiHash.trim(),
        app_title: appTitle || undefined,
      });
      void trackAnalyticsEvent("registration", savedApiId);
      await refresh();
      setStep("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    if (!qrLoginId) {
      await startQr();
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await refreshQrLogin(qrLoginId);
      setQrLoginId(res.login_id);
      setQrUrl(res.url);
      setQrExpired(false);
      setQrCountdown(res.expires_in ?? 25);
      setInfo("");
      stopPollRef.current?.();
      stopPollRef.current = pollQrStatus(res.login_id, async (s) => {
        if (s.status === "authorized") {
          stopPollRef.current?.();
          setQrExpired(false);
          await refresh();
        } else if (s.status === "token_expired" || s.status === "expired") {
          setQrExpired(true);
          setQrCountdown(0);
          setError("");
          setInfo(s.message || i18n.auth.qrExpired);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить QR");
    } finally {
      setLoading(false);
    }
  };

  const standaloneIndex =
    step === "credentials" ? 0 : step === "auth" ? 1 : 2;
  const standaloneCompleted =
    step === "done" ? 2 : step === "auth" ? 0 : -1;

  if (wizard && status?.is_authorized) {
    return null;
  }

  const booting = (wizard || embedded) && serverHosted === null;

  if (booting) {
    return (
      <div className={`tg-auth ${embedded ? "embedded" : ""} ${wizard ? "wizard-mode" : ""}`}>
        <div className="tg-auth-loading tg-auth-loading--block">
          <span className="tg-auth-spinner" aria-hidden />
        </div>
      </div>
    );
  }

  const showHostedLogin = isHostedFlow && !status?.is_authorized;
  const showCredentialsForm =
    !isHostedFlow && !status?.is_authorized && !status?.has_credentials;
  const showLegacyAuth =
    !isHostedFlow && !status?.is_authorized && Boolean(status?.has_credentials);

  const hostedQrBlock = (
    <div className="tg-auth-qr-stage">
      {!qrUrl && loading && (
        <div className="tg-auth-loading">
          <span className="tg-auth-spinner" aria-hidden />
          <p>Генерация QR-кода…</p>
        </div>
      )}
      {(qrUrl || qrExpired) && !loading && (
        <>
          <div
            className={`tg-auth-qr-frame${qrExpired ? " tg-auth-qr-frame--expired" : ""}`}
          >
            {qrUrl && (
              <img
                src={telegramQrImageUrl(qrUrl, 260)}
                alt="QR для входа в Telegram"
                width={220}
                height={220}
                className={qrExpired ? "tg-auth-qr-img--faded" : undefined}
              />
            )}
            {qrExpired && (
              <div className="tg-auth-qr-expired">
                <p className="tg-auth-qr-expired-title">{i18n.auth.qrExpired}</p>
                <button
                  type="button"
                  className="tg-auth-btn tg-auth-btn--primary"
                  onClick={() => void handleRefreshQr()}
                  disabled={loading}
                >
                  {loading ? "Обновление…" : i18n.auth.refreshQr}
                </button>
              </div>
            )}
            {!qrExpired && qrCountdown > 0 && (
              <span className="tg-auth-qr-badge" aria-label="Секунд до обновления">
                {qrCountdown}
              </span>
            )}
          </div>
          <p className="tg-auth-qr-hint">{i18n.auth.qrHint}</p>
          <p className="tg-auth-qr-scan-note">{i18n.auth.qrScanNote}</p>
          {!qrExpired && (
            <div className="tg-auth-qr-actions">
              <button
                type="button"
                className="tg-auth-btn tg-auth-btn--ghost"
                onClick={() => void handleRefreshQr()}
                disabled={loading}
              >
                {loading ? "Обновление…" : i18n.auth.refreshQr}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (showHostedLogin) {
    return (
      <div className={`tg-auth ${embedded ? "embedded" : ""} ${wizard ? "wizard-mode" : ""}`}>
        <div className="tg-auth-hosted-wrap">
          <div className="tg-auth-card">
            <div className="tg-auth-card__brand">
              <div className="tg-auth-card__icon" aria-hidden>
                <TelegramLogo size={52} />
              </div>
              <h2 className="tg-auth-card__title">{i18n.auth.title}</h2>
              <p className="tg-auth-card__lead">{i18n.auth.lead}</p>
            </div>

            {error && <p className="tg-auth-error">{error}</p>}
            {info && !error && <p className="tg-auth-info">{info}</p>}

            <label
              className={`tg-auth-consent${consentError ? " tg-auth-consent--error" : ""}`}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => onConsentChange(e.target.checked)}
              />
              <span>
                {i18n.auth.consentLabel}{" "}
                <a href="/privacy" target="_blank" rel="noreferrer">
                  {i18n.auth.privacyLink}
                </a>
                .
              </span>
            </label>

            {consent && hostedQrBlock}

            {!consent && (
              <p className="tg-auth-qr-stage tg-auth-qr-stage--waiting-consent">
                {i18n.auth.consentHint}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tg-auth tg-auth-legacy ${embedded ? "embedded" : ""} ${wizard ? "wizard-mode" : ""}`}
    >
      {!embedded && !wizard && <h1>Настройка Telegram</h1>}

      {!wizard && !embedded && (
        <SetupStepper
          steps={STANDALONE_STEPS}
          currentIndex={standaloneIndex}
          completedThrough={standaloneCompleted}
        />
      )}

      {error && <p className="tg-auth-error">{error}</p>}
      {info && !error && <p className="tg-auth-info">{info}</p>}

      {showCredentialsForm && (
        <form onSubmit={saveCredentials} className="auth-card">
          <h2>Ключи приложения</h2>
          <ol className="mini-steps">
            <li>
              <a href={MY_TELEGRAM_APPS_URL} target="_blank" rel="noreferrer">
                my.telegram.org/apps
              </a>
            </li>
            <li>Скопируйте App api_id и App api_hash</li>
          </ol>
          <label>
            App api_id
            <input
              type="number"
              value={apiId}
              onChange={(e) => setApiId(e.target.value)}
              placeholder="11080576"
              required
            />
          </label>
          <label>
            App api_hash
            <input
              type="password"
              value={apiHash}
              onChange={(e) => setApiHash(e.target.value)}
              required
            />
          </label>
          <label>
            App title <span className="opt">(опционально)</span>
            <input value={appTitle} onChange={(e) => setAppTitle(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Сохранение…" : "Далее → вход"}
          </button>
        </form>
      )}

      {!showCredentialsForm &&
        !showLegacyAuth &&
        !status?.is_authorized &&
        status &&
        serverHosted !== null && (
          <p className="tg-auth-error">{i18n.auth.saveCredentialsFirst}</p>
        )}

      {showLegacyAuth && (
        <div className="auth-card auth-flow">
          <div className="auth-panel qr-panel">
              <p className="hint center">{i18n.auth.qrHint}</p>
              {!qrUrl && loading && (
                <div className="tg-auth-loading">
                  <span className="tg-auth-spinner" aria-hidden />
                  <p>Генерация QR…</p>
                </div>
              )}
              {!qrUrl && !loading && (
                <button type="button" className="btn-primary" onClick={startQr}>
                  {i18n.auth.showQr}
                </button>
              )}
              {(qrUrl || qrExpired) && (
                <div className="qr-wrap">
                  <div
                    className={`tg-auth-qr-frame${qrExpired ? " tg-auth-qr-frame--expired" : ""}`}
                  >
                    {qrUrl && (
                      <img
                        src={telegramQrImageUrl(qrUrl, 240)}
                        alt="QR для входа в Telegram"
                        width={200}
                        height={200}
                        className={qrExpired ? "tg-auth-qr-img--faded" : undefined}
                      />
                    )}
                    {qrExpired && (
                      <div className="tg-auth-qr-expired">
                        <p className="tg-auth-qr-expired-title">{i18n.auth.qrExpired}</p>
                        <button
                          type="button"
                          className="tg-auth-btn tg-auth-btn--primary"
                          onClick={() => void handleRefreshQr()}
                          disabled={loading}
                        >
                          {loading ? "…" : i18n.auth.refreshQr}
                        </button>
                      </div>
                    )}
                  </div>
                  {!qrExpired && qrCountdown > 0 && (
                    <p className="hint center">Обновится через {qrCountdown} сек</p>
                  )}
                  <p className="hint center tg-auth-qr-scan-note">{i18n.auth.qrScanNote}</p>
                  {!qrExpired && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => void handleRefreshQr()}
                      disabled={loading}
                    >
                      {loading ? "…" : i18n.auth.refreshQr}
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {step === "done" && status?.setup_complete && !wizard && (
        <div className="auth-card done-card">
          <p className="done-title">Готово</p>
          <p>
            {status.first_name} {status.last_name}
            {status.username && ` (@${status.username})`}
          </p>
        </div>
      )}
    </div>
  );
}
