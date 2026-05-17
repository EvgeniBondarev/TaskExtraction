import { useCallback, useEffect, useState } from "react";
import {
  fetchTelegramCredentials,
  fetchTelegramStatus,
  logoutTelegram,
  MY_TELEGRAM_APPS_URL,
  resetTelegramAll,
  saveTelegramCredentials,
  TelegramStatus,
} from "../api/telegram";
import { fetchChatsStatus } from "../api/chats";
import { ChatPicker } from "./ChatPicker";
import { SettingsFormSkeleton } from "./PageSkeletons";
import { SetupStepper } from "./SetupStepper";
import { TelegramAuth } from "../pages/TelegramAuth";
import { getTelegramWizardStep, TELEGRAM_WIZARD_STEPS } from "../utils/telegramWizardSteps";

interface Props {
  onStatusChange?: () => void;
  onGoToChatsTab?: () => void;
  /** Степпер рендерится на странице настроек сверху */
  hideStepper?: boolean;
}

export function TelegramSetupWizard({ onStatusChange, onGoToChatsTab, hideStepper }: Props) {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [hasMonitored, setHasMonitored] = useState(false);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [hashMasked, setHashMasked] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const reload = useCallback(async () => {
    const s = await fetchTelegramStatus();
    setStatus(s);
    if (s.is_authorized) {
      const cs = await fetchChatsStatus().catch(() => null);
      setHasMonitored(Boolean(cs?.has_monitored));
    } else {
      setHasMonitored(false);
    }
    const creds = await fetchTelegramCredentials();
    if (creds) {
      setApiId(String(creds.api_id));
      setHashMasked(creds.api_hash_masked);
      if (creds.app_title) setAppTitle(creds.app_title);
    }
    onStatusChange?.();
  }, [onStatusChange]);

  useEffect(() => {
    setInitialLoading(true);
    reload()
      .catch(() => setError("Не удалось загрузить настройки Telegram"))
      .finally(() => setInitialLoading(false));
  }, [reload]);

  const { current, completed } = getTelegramWizardStep(status, hasMonitored);
  const allDone = status?.is_authorized && hasMonitored;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiId.trim() || !apiHash.trim()) {
      setError("Укажите api_id и полный api_hash");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await saveTelegramCredentials({
        api_id: Number(apiId),
        api_hash: apiHash.trim(),
        app_title: appTitle || undefined,
      });
      setApiHash("");
      setInfo("Ключи сохранены — перейдите к входу");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    try {
      await logoutTelegram();
      setInfo("Вы вышли из Telegram");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm("Удалить все данные Telegram? Потребуется настройка заново.")) return;
    setLoading(true);
    try {
      await resetTelegramAll();
      setApiId("");
      setApiHash("");
      setInfo("Данные удалены");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="tg-wizard">
        <SettingsFormSkeleton fields={3} />
      </div>
    );
  }

  return (
    <div className="tg-wizard">
      {!hideStepper && (
        <SetupStepper
          steps={TELEGRAM_WIZARD_STEPS}
          currentIndex={current}
          completedThrough={completed}
        />
      )}

      {allDone && status && (
        <div className="wizard-hero success">
          <div className="hero-icon" aria-hidden>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path
                d="M10 16.5L14 20.5L22 11.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="hero-body">
            <h3>Telegram подключён</h3>
            <p>
              {status.first_name} {status.last_name}
              {status.username && (
                <>
                  {" "}
                  <span className="username">@{status.username}</span>
                </>
              )}
            </p>
            {hasMonitored && <span className="hero-badge">Чаты настроены</span>}
          </div>
          <button type="button" className="btn-ghost" onClick={handleLogout} disabled={loading}>
            Выйти
          </button>
        </div>
      )}

      {error && <p className="wizard-error">{error}</p>}
      {info && !error && <p className="wizard-info">{info}</p>}

      {current === 0 && !status?.has_credentials && (
        <section className="wizard-panel">
          <header className="panel-head">
            <span className="panel-step">Шаг 1</span>
            <h3>Ключи приложения Telegram</h3>
            <p>
              Создайте приложение на{" "}
              <a href={MY_TELEGRAM_APPS_URL} target="_blank" rel="noreferrer">
                my.telegram.org/apps
              </a>{" "}
              и скопируйте <code>api_id</code> и <code>api_hash</code>.
            </p>
          </header>
          <ol className="panel-checklist">
            <li>Откройте my.telegram.org → API development tools</li>
            <li>Создайте приложение (любое название)</li>
            <li>Скопируйте App api_id и App api_hash сюда</li>
          </ol>
          <form onSubmit={handleSaveCredentials} className="wizard-form">
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
                placeholder="32-символьный hash"
                required
              />
            </label>
            <label>
              App title <span className="opt">(опционально)</span>
              <input value={appTitle} onChange={(e) => setAppTitle(e.target.value)} />
            </label>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Сохранение…" : "Сохранить и перейти к входу →"}
            </button>
          </form>
        </section>
      )}

      {current === 1 && status?.has_credentials && !status.is_authorized && (
        <section className="wizard-panel">
          <header className="panel-head">
            <span className="panel-step">Шаг 2</span>
            <h3>Вход в аккаунт Telegram</h3>
            <p>Код придёт в приложение Telegram или отсканируйте QR в «Устройства».</p>
          </header>
          <TelegramAuth
            embedded
            wizard
            onComplete={() => {
              setInfo("Вход выполнен");
              reload();
            }}
          />
        </section>
      )}

      {current === 2 && status?.is_authorized && !hasMonitored && (
        <section className="wizard-panel">
          <header className="panel-head">
            <span className="panel-step">Шаг 3</span>
            <h3>Выберите чаты для мониторинга</h3>
            <p>Отметьте группы и каналы, из которых извлекать задачи.</p>
          </header>
          <ChatPicker
            onSaved={() => {
              setInfo("Чаты сохранены");
              reload();
            }}
            submitLabel="Сохранить и завершить"
          />
          {onGoToChatsTab && (
            <button type="button" className="btn-link" onClick={onGoToChatsTab}>
              Открыть вкладку «Чаты» для редактирования
            </button>
          )}
        </section>
      )}

      {current === 3 && status?.is_authorized && !allDone && (
        <section className="wizard-panel done-panel">
          <p className="done-text">
            Настройка завершена. Перейдите к задачам или подключите интеграции во вкладке «Интеграции».
          </p>
        </section>
      )}

      {status?.has_credentials && (
        <details
          className="wizard-advanced"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary>Дополнительно: смена ключей и сброс</summary>
          <div className="advanced-inner">
            {hashMasked && <p className="hint">Текущий hash: {hashMasked}</p>}
            <form onSubmit={handleSaveCredentials} className="wizard-form compact">
              <label>
                App api_id
                <input type="number" value={apiId} onChange={(e) => setApiId(e.target.value)} />
              </label>
              <label>
                Новый api_hash
                <input
                  type="password"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder="При смене — полный hash"
                />
              </label>
              <button type="submit" className="btn-secondary" disabled={loading}>
                Обновить ключи
              </button>
            </form>
            <button type="button" className="btn-danger" onClick={handleResetAll} disabled={loading}>
              Удалить все данные Telegram
            </button>
          </div>
        </details>
      )}

      <style>{`
        .tg-wizard { max-width: 640px; }
        .wizard-hero {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.15rem;
          border-radius: 14px;
          margin-bottom: 1.25rem;
          border: 1px solid var(--border);
          background: var(--surface);
        }
        .wizard-hero.success {
          border-color: rgba(34, 197, 94, 0.4);
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, var(--surface) 60%);
        }
        .hero-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4ade80;
          background: rgba(34, 197, 94, 0.12);
          flex-shrink: 0;
        }
        .hero-body { flex: 1; min-width: 0; }
        .hero-body h3 { margin: 0 0 0.2rem; font-size: 1rem; }
        .hero-body p { margin: 0; font-size: 0.88rem; color: var(--muted); }
        .username { color: #60a5fa; }
        .hero-badge {
          display: inline-block;
          margin-top: 0.35rem;
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--text); }
        .wizard-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.35rem 1.4rem;
          margin-bottom: 1rem;
          animation: panel-in 0.35s ease-out;
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        .panel-head { margin-bottom: 1.1rem; }
        .panel-step {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #93c5fd;
          margin-bottom: 0.35rem;
        }
        .panel-head h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
        .panel-head p { margin: 0; font-size: 0.88rem; color: var(--muted); line-height: 1.45; }
        .panel-head code { font-size: 0.82em; color: #93c5fd; }
        .panel-checklist {
          margin: 0 0 1.15rem;
          padding-left: 1.15rem;
          color: var(--muted);
          font-size: 0.85rem;
          line-height: 1.65;
        }
        .wizard-form label {
          display: block;
          margin-bottom: 0.85rem;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .wizard-form input {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 10px;
          padding: 0.6rem 0.7rem;
          font: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .wizard-form input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .opt { opacity: 0.7; font-weight: 400; }
        .btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          color: #fff;
          padding: 0.7rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          margin-top: 0.25rem;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.15s;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-danger {
          width: 100%;
          margin-top: 0.75rem;
          background: transparent;
          border: 1px solid rgba(220, 38, 38, 0.5);
          color: #f87171;
          padding: 0.55rem;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-link {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 0.85rem;
          margin-top: 0.75rem;
          padding: 0;
          cursor: pointer;
        }
        .wizard-error {
          color: #f87171;
          font-size: 0.88rem;
          padding: 0.65rem 0.85rem;
          background: rgba(248, 113, 113, 0.08);
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .wizard-info {
          color: #60a5fa;
          font-size: 0.88rem;
          margin-bottom: 1rem;
        }
        .done-panel { text-align: center; padding: 2rem 1.5rem; }
        .done-text { margin: 0; color: var(--muted); font-size: 0.95rem; }
        .wizard-advanced {
          margin-top: 1.5rem;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.15);
        }
        .wizard-advanced summary {
          padding: 0.75rem 1rem;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--muted);
          list-style: none;
        }
        .wizard-advanced summary::-webkit-details-marker { display: none; }
        .advanced-inner { padding: 0 1rem 1rem; }
        .advanced-inner .hint { font-size: 0.8rem; color: var(--muted); margin: 0 0 0.75rem; }
        .wizard-form.compact { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
