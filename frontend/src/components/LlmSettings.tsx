import { useCallback, useEffect, useState } from "react";
import { fetchLlmStatus, LlmStatus, LlmTestResult, saveLlmSettings, testLlmSettings } from "../api/llm";
import { SettingsFormSkeleton } from "./PageSkeletons";

export function LlmSettings({ embedded }: { embedded?: boolean } = {}) {
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<LlmTestResult | null>(null);

  const reload = useCallback(async () => {
    const s = await fetchLlmStatus();
    setStatus(s);
    setModel(s.user_model || "");
  }, []);

  useEffect(() => {
    reload().catch(() => setError("Не удалось загрузить настройки OpenRouter"));
  }, [reload]);

  const canEditModel = status?.has_user_key || apiKey.trim().length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const body: { api_key?: string; model?: string } = {};
      if (apiKey.trim()) body.api_key = apiKey.trim();
      if (canEditModel && model.trim()) body.model = model.trim();
      const s = await saveLlmSettings(body);
      setStatus(s);
      setApiKey("");
      setInfo("Настройки OpenRouter сохранены");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setError("");
    setInfo("");
    setTestResult(null);
    setTesting(true);
    try {
      const body: { api_key?: string; model?: string } = {};
      if (apiKey.trim()) body.api_key = apiKey.trim();
      if (canEditModel && model.trim()) body.model = model.trim();
      const result = await testLlmSettings(body);
      setTestResult(result);
      if (!result.success) setError(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка теста");
    } finally {
      setTesting(false);
    }
  };

  const handleClearKey = async () => {
    if (!confirm("Удалить ваш API-ключ и вернуться к встроенной модели?")) return;
    setLoading(true);
    setError("");
    try {
      const s = await saveLlmSettings({ clear_user_key: true });
      setStatus(s);
      setApiKey("");
      setModel("");
      setTestResult(null);
      setInfo("Используется встроенный ключ OpenRouter");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <section className={`llm-settings${embedded ? " embedded" : ""}`}>
        <SettingsFormSkeleton fields={2} />
      </section>
    );
  }

  return (
    <section className={`llm-settings${embedded ? " embedded" : ""}`}>
      {!embedded && (
        <>
          <h3>OpenRouter (LLM)</h3>
          <p className="hint">
            Извлечение задач через{" "}
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer">
              openrouter.ai
            </a>
          </p>
        </>
      )}

      <div className="status-grid">
        <div className="status-card">
          <span className="stat-label">Провайдер</span>
          <span className="stat-value">{status.provider}</span>
        </div>
        <div className="status-card">
          <span className="stat-label">Ключ</span>
          <span className={`stat-value ${status.key_source === "user" ? "ok" : ""}`}>
            {status.key_source === "user" ? `Ваш · ${status.user_key_masked}` : "Встроенный"}
          </span>
        </div>
        <div className="status-card wide">
          <span className="stat-label">Активная модель</span>
          <code className="stat-code">{status.active_model}</code>
        </div>
      </div>

      {error && <p className="llm-error">{error}</p>}
      {info && !error && <p className="llm-info">{info}</p>}

      <form className="llm-form" onSubmit={handleSave}>
        <label>
          OpenRouter API key <span className="opt">(опционально)</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-…"
            autoComplete="off"
          />
        </label>
        <label className={!canEditModel ? "disabled" : ""}>
          Своя модель
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={status.default_model}
            disabled={!canEditModel}
          />
          {!canEditModel && (
            <span className="field-hint">Укажите свой API-ключ, чтобы выбрать модель</span>
          )}
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || testing}>
            {loading ? "Сохранение…" : "Сохранить"}
          </button>
          <button type="button" className="btn-secondary" onClick={handleTest} disabled={loading || testing}>
            {testing ? "Тест…" : "Проверить"}
          </button>
          {status.has_user_key && (
            <button type="button" className="btn-ghost" onClick={handleClearKey} disabled={loading || testing}>
              Сбросить ключ
            </button>
          )}
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? "ok" : "fail"}`}>
            <p className="test-title">{testResult.success ? "Тест пройден" : "Тест не пройден"}</p>
            <p>{testResult.message}</p>
            <p className="test-meta">
              <code>{testResult.model}</code>
              {testResult.latency_ms != null && ` · ${testResult.latency_ms} мс`}
            </p>
            {testResult.reply_preview && <pre className="test-preview">{testResult.reply_preview}</pre>}
          </div>
        )}
      </form>

      <style>{`
        .llm-settings {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.25rem 1.35rem;
        }
        .llm-settings.embedded {
          padding: 0;
          border: none;
          background: transparent;
          border-radius: 0;
        }
        .llm-settings h3 { margin: 0 0 0.35rem; font-size: 1rem; }
        .hint { color: var(--muted); font-size: 0.85rem; margin: 0 0 1rem; line-height: 1.45; }
        .status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1.15rem;
        }
        .status-card {
          padding: 0.65rem 0.75rem;
          border-radius: 10px;
          background: var(--bg);
          border: 1px solid var(--border);
        }
        .status-card.wide { grid-column: 1 / -1; }
        .stat-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-bottom: 0.2rem;
        }
        .stat-value { font-size: 0.88rem; font-weight: 500; }
        .stat-value.ok { color: #4ade80; }
        .stat-code {
          display: block;
          font-size: 0.8rem;
          color: #c4b5fd;
          word-break: break-all;
        }
        .llm-error {
          color: #f87171;
          font-size: 0.85rem;
          padding: 0.55rem 0.75rem;
          background: rgba(248, 113, 113, 0.08);
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }
        .llm-info {
          color: #60a5fa;
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }
        .llm-form label {
          display: block;
          margin-bottom: 0.85rem;
          font-size: 0.78rem;
          color: var(--muted);
        }
        .llm-form label.disabled { opacity: 0.65; }
        .llm-form input {
          display: block;
          width: 100%;
          margin-top: 0.3rem;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 10px;
          padding: 0.6rem 0.7rem;
          font: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .llm-form input:focus {
          outline: none;
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
        }
        .llm-form input:disabled { opacity: 0.5; cursor: not-allowed; }
        .opt { font-weight: 400; opacity: 0.75; }
        .field-hint { display: block; margin-top: 0.25rem; font-size: 0.72rem; }
        .form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .btn-primary {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          color: #fff;
          padding: 0.6rem 1.1rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font: inherit;
        }
        .btn-secondary {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.6rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          font: inherit;
        }
        .btn-ghost {
          background: transparent;
          border: none;
          color: var(--muted);
          padding: 0.6rem 0.75rem;
          cursor: pointer;
          font: inherit;
          font-size: 0.85rem;
        }
        .btn-ghost:hover { color: #f87171; }
        button:disabled { opacity: 0.55; cursor: not-allowed; }
        .test-result {
          margin-top: 1rem;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          font-size: 0.88rem;
          line-height: 1.45;
        }
        .test-result.ok {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
        .test-result.fail {
          background: rgba(248, 113, 113, 0.08);
          border: 1px solid rgba(248, 113, 113, 0.35);
        }
        .test-title { font-weight: 600; margin: 0 0 0.25rem; }
        .test-result p { margin: 0.15rem 0; }
        .test-meta { color: var(--muted); font-size: 0.8rem; }
        .test-preview {
          margin: 0.5rem 0 0;
          padding: 0.55rem;
          border-radius: 8px;
          background: var(--bg);
          font-size: 0.75rem;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </section>
  );
}
