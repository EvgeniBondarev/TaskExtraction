import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchTelegramStatus,
  MY_TELEGRAM_APPS_URL,
  pollQrStatus,
  refreshQrLogin,
  saveTelegramCredentials,
  sendPhoneCode,
  startQrLogin,
  TelegramStatus,
  verifyPhoneCode,
} from "../api/telegram";
import { SetupStepper, SetupStepItem } from "../components/SetupStepper";

type Step = "credentials" | "auth" | "done";
type AuthMethod = "phone" | "qr";
type PhoneStep = "phone" | "code" | "password";

const STANDALONE_STEPS: SetupStepItem[] = [
  { id: "credentials", label: "Ключи", description: "API приложения" },
  { id: "auth", label: "Вход", description: "Аккаунт" },
  { id: "done", label: "Готово", description: "Подключено" },
];

const PHONE_SUBSTEPS = [
  { id: "phone", label: "Номер" },
  { id: "code", label: "Код" },
  { id: "password", label: "2FA" },
];

interface Props {
  onComplete?: () => void;
  embedded?: boolean;
  /** Только вход (ключи уже сохранены на странице настроек) */
  wizard?: boolean;
}

export function TelegramAuth({ onComplete, embedded, wizard }: Props) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [step, setStep] = useState<Step>(wizard ? "auth" : "credentials");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("qr");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [phoneLoginId, setPhoneLoginId] = useState<string | null>(null);
  const [qrLoginId, setQrLoginId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const stopPollRef = useRef<(() => void) | null>(null);
  const wasCompleteRef = useRef(false);
  const qrAutoStarted = useRef(false);

  const refresh = useCallback(async () => {
    const s = await fetchTelegramStatus();
    setStatus(s);
    if (s.setup_complete) {
      setStep("done");
      if (!wasCompleteRef.current) {
        wasCompleteRef.current = true;
        onComplete?.();
      }
    } else {
      wasCompleteRef.current = false;
      if (wizard || s.has_credentials) {
        setStep("auth");
        if (s.api_id) setApiId(String(s.api_id));
      } else {
        setStep("credentials");
      }
    }
  }, [onComplete, wizard]);

  useEffect(() => {
    refresh().catch(() => setError("Не удалось связаться с API"));
    return () => stopPollRef.current?.();
  }, [refresh]);

  useEffect(() => {
    if (qrCountdown <= 0) return;
    const t = setInterval(() => setQrCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [qrCountdown]);

  const startQr = useCallback(async () => {
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
      setQrCountdown(res.expires_in ?? 25);
      stopPollRef.current = pollQrStatus(res.login_id, async (s) => {
        if (s.status === "authorized") {
          stopPollRef.current?.();
          setQrUrl(null);
          setQrLoginId(null);
          await refresh();
          setLoading(false);
        } else if (s.status === "token_expired") {
          setError(s.message || "QR истёк — нажмите «Обновить»");
          setQrUrl(null);
          setLoading(false);
        } else if (s.status === "expired") {
          setError("Сессия QR истекла");
          setQrUrl(null);
          setLoading(false);
        }
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка QR");
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (
      wizard &&
      step === "auth" &&
      authMethod === "qr" &&
      !qrUrl &&
      status?.has_credentials &&
      !status.is_authorized &&
      !qrAutoStarted.current
    ) {
      qrAutoStarted.current = true;
      startQr();
    }
  }, [wizard, step, authMethod, qrUrl, status, startQr]);

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
      await saveTelegramCredentials({
        api_id: Number(apiId),
        api_hash: apiHash.trim(),
        app_title: appTitle || undefined,
      });
      await refresh();
      setStep("auth");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await sendPhoneCode(phone);
      if (res.already_authorized) {
        await refresh();
        return;
      }
      setPhoneLoginId(res.login_id);
      setPhoneStep("code");
      setInfo(res.message || "Код отправлен в Telegram");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneLoginId) return;
    setError("");
    setLoading(true);
    try {
      const res = await verifyPhoneCode(
        phoneLoginId,
        code,
        phoneStep === "password" ? password : undefined
      );
      if (res.status === "password_required") {
        setPhoneStep("password");
        setInfo(res.message || "Введите пароль 2FA");
        setLoading(false);
        return;
      }
      if (res.status === "authorized") {
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
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
      setQrCountdown(res.expires_in ?? 25);
      stopPollRef.current?.();
      stopPollRef.current = pollQrStatus(res.login_id, async (s) => {
        if (s.status === "authorized") {
          stopPollRef.current?.();
          await refresh();
        } else if (s.status === "token_expired") {
          setError(s.message || "QR истёк");
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обновить QR");
    } finally {
      setLoading(false);
    }
  };

  const qrImage =
    qrUrl &&
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}&margin=12`;

  const standaloneIndex =
    step === "credentials" ? 0 : step === "auth" ? 1 : 2;
  const standaloneCompleted =
    step === "done" ? 2 : step === "auth" ? 0 : -1;

  const phoneSubIndex = phoneStep === "phone" ? 0 : phoneStep === "code" ? 1 : 2;

  if (wizard && status?.is_authorized) {
    return null;
  }

  return (
    <div className={`tg-auth ${embedded ? "embedded" : ""} ${wizard ? "wizard-mode" : ""}`}>
      {!embedded && !wizard && <h1>Настройка Telegram</h1>}

      {!wizard && !embedded && (
        <SetupStepper
          steps={STANDALONE_STEPS}
          currentIndex={standaloneIndex}
          completedThrough={standaloneCompleted}
        />
      )}

      {!wizard && !status?.is_authorized && (
        <div className="apps-banner">
          <p>
            Ключи с{" "}
            <a href={MY_TELEGRAM_APPS_URL} target="_blank" rel="noreferrer">
              my.telegram.org/apps
            </a>
            . Вход — телефон + код или QR в приложении Telegram.
          </p>
        </div>
      )}

      {error && <p className="auth-error">{error}</p>}
      {info && !error && <p className="auth-info">{info}</p>}

      {step === "credentials" && !status?.is_authorized && !wizard && (
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

      {step === "auth" && status?.has_credentials && !status?.is_authorized && (
        <div className="auth-card auth-flow">
          <div className="method-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === "qr"}
              className={authMethod === "qr" ? "active" : ""}
              onClick={() => setAuthMethod("qr")}
            >
              <span className="tab-icon">▣</span>
              QR-код
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMethod === "phone"}
              className={authMethod === "phone" ? "active" : ""}
              onClick={() => setAuthMethod("phone")}
            >
              <span className="tab-icon">☎</span>
              Телефон
            </button>
          </div>

          {authMethod === "phone" && (
            <div className="auth-panel">
              <div className="phone-substeps">
                {PHONE_SUBSTEPS.map((s, i) => (
                  <span
                    key={s.id}
                    className={`phone-sub${i <= phoneSubIndex ? " done" : ""}${i === phoneSubIndex ? " current" : ""}`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>

              {phoneStep === "phone" && (
                <form onSubmit={handleSendPhone}>
                  <p className="hint">Номер в международном формате — код придёт в Telegram.</p>
                  <label>
                    Номер телефона
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+79991234567"
                      required
                      autoComplete="tel"
                    />
                  </label>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Отправка…" : "Получить код"}
                  </button>
                </form>
              )}

              {(phoneStep === "code" || phoneStep === "password") && (
                <form onSubmit={handleVerifyCode}>
                  <p className="hint">
                    {phoneStep === "password"
                      ? "Введите облачный пароль двухфакторной аутентификации"
                      : "Код из чата «Telegram» в приложении"}
                  </p>
                  {phoneStep !== "password" && (
                    <label>
                      Код подтверждения
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="12345"
                        required
                        autoComplete="one-time-code"
                        inputMode="numeric"
                      />
                    </label>
                  )}
                  {phoneStep === "password" && (
                    <label>
                      Пароль 2FA
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </label>
                  )}
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Проверка…" : "Войти"}
                  </button>
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => {
                      setPhoneStep("phone");
                      setCode("");
                      setPassword("");
                    }}
                  >
                    ← Другой номер
                  </button>
                </form>
              )}
            </div>
          )}

          {authMethod === "qr" && (
            <div className="auth-panel qr-panel">
              <p className="hint center">
                Telegram → <strong>Настройки</strong> → <strong>Устройства</strong> →{" "}
                <strong>Подключить устройство</strong>
              </p>
              {!qrUrl && loading && (
                <div className="qr-loading">
                  <span className="spinner" />
                  <p>Генерация QR…</p>
                </div>
              )}
              {!qrUrl && !loading && (
                <button type="button" className="btn-primary" onClick={startQr}>
                  Показать QR-код
                </button>
              )}
              {qrUrl && (
                <div className="qr-wrap">
                  {qrImage && <img src={qrImage} alt="QR для входа в Telegram" className="qr-img" />}
                  <div className="qr-timer">
                    <div
                      className="qr-timer-ring"
                      style={{
                        background: `conic-gradient(#3b82f6 ${((25 - qrCountdown) / 25) * 360}deg, var(--border) 0deg)`,
                      }}
                    />
                    <span>{qrCountdown > 0 ? qrCountdown : "…"}</span>
                  </div>
                  {qrCountdown > 0 && (
                    <p className="hint center">Обновится через {qrCountdown} сек</p>
                  )}
                  <a href={qrUrl} className="tg-deeplink" target="_blank" rel="noreferrer">
                    Открыть в Telegram
                  </a>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleRefreshQr}
                    disabled={loading}
                  >
                    {loading ? "…" : "Обновить QR"}
                  </button>
                </div>
              )}
            </div>
          )}
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

      <style>{`
        .tg-auth {
          max-width: ${wizard ? "100%" : "520px"};
          margin: 0 auto;
          padding: ${embedded || wizard ? "0" : "2rem 1rem"};
        }
        .tg-auth h1 {
          margin: 0 0 1.25rem;
          font-size: 1.4rem;
          text-align: center;
        }
        .apps-banner {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.35);
          border-radius: 12px;
          padding: 0.9rem 1rem;
          margin-bottom: 1rem;
          font-size: 0.88rem;
          line-height: 1.45;
        }
        .auth-error {
          color: #f87171;
          font-size: 0.88rem;
          padding: 0.6rem 0.85rem;
          background: rgba(248, 113, 113, 0.08);
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }
        .auth-info {
          color: #60a5fa;
          font-size: 0.88rem;
          margin-bottom: 0.75rem;
        }
        .auth-card {
          background: ${wizard ? "transparent" : "var(--surface)"};
          border: ${wizard ? "none" : "1px solid var(--border)"};
          border-radius: ${wizard ? "0" : "14px"};
          padding: ${wizard ? "0" : "1.35rem"};
        }
        .auth-card h2 { margin: 0 0 0.75rem; font-size: 1rem; }
        .mini-steps {
          margin: 0 0 1rem;
          padding-left: 1.15rem;
          color: var(--muted);
          font-size: 0.85rem;
          line-height: 1.6;
        }
        .method-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1.15rem;
          padding: 0.25rem;
          background: var(--bg);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .method-tabs button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.65rem;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-weight: 500;
          font-size: 0.88rem;
          transition: background 0.15s, color 0.15s;
        }
        .method-tabs button.active {
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }
        .tab-icon { opacity: 0.7; font-size: 1rem; }
        .phone-substeps {
          display: flex;
          gap: 0.35rem;
          margin-bottom: 1rem;
        }
        .phone-sub {
          flex: 1;
          text-align: center;
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 0.35rem 0.25rem;
          border-radius: 6px;
          color: var(--muted);
          background: var(--bg);
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .phone-sub.done { color: #4ade80; border-color: rgba(34, 197, 94, 0.35); }
        .phone-sub.current {
          color: #93c5fd;
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.1);
        }
        label {
          display: block;
          margin-bottom: 0.85rem;
          font-size: 0.78rem;
          color: var(--muted);
        }
        input {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 10px;
          padding: 0.6rem 0.7rem;
          font: inherit;
        }
        input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .hint { color: var(--muted); font-size: 0.85rem; margin: 0 0 0.85rem; line-height: 1.4; }
        .hint.center { text-align: center; }
        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #229ed9, #0088cc);
          border: none;
          color: #fff;
          padding: 0.7rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.25rem;
        }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-secondary {
          width: 100%;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.55rem;
          border-radius: 10px;
          margin-top: 0.5rem;
          cursor: pointer;
        }
        .btn-text {
          width: 100%;
          background: none;
          border: none;
          color: var(--muted);
          margin-top: 0.5rem;
          padding: 0.4rem;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .btn-text:hover { color: var(--accent); }
        .opt { opacity: 0.65; font-weight: 400; }
        .qr-panel { text-align: center; }
        .qr-wrap { display: flex; flex-direction: column; align-items: center; }
        .qr-img {
          border-radius: 12px;
          background: #fff;
          padding: 0.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }
        .qr-loading {
          padding: 2.5rem;
          color: var(--muted);
        }
        .spinner {
          display: inline-block;
          width: 2rem;
          height: 2rem;
          border: 3px solid var(--border);
          border-top-color: #229ed9;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .qr-timer {
          position: relative;
          width: 2.5rem;
          height: 2.5rem;
          margin: 0.75rem auto 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-timer-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          mask: radial-gradient(farthest-side, transparent 58%, #000 60%);
          -webkit-mask: radial-gradient(farthest-side, transparent 58%, #000 60%);
        }
        .qr-timer span {
          position: relative;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted);
        }
        .tg-deeplink {
          display: inline-block;
          margin: 0.5rem 0;
          font-size: 0.85rem;
          word-break: break-all;
        }
        .done-card { text-align: center; padding: 2rem 1rem; }
        .done-title { color: #4ade80; font-weight: 700; font-size: 1.1rem; margin: 0 0 0.5rem; }
        .wizard-mode .auth-card { padding: 0; }
      `}</style>
    </div>
  );
}
