import { useCallback, useEffect, useState } from "react";
import { fetchLlmStatus, LlmStatus, LlmTestResult, saveLlmSettings, testLlmSettings } from "../api/llm";
import { SettingsFormSkeleton } from "./PageSkeletons";
import { useI18n } from "../i18n";

export function LlmSettings({ embedded }: { embedded?: boolean } = {}) {
  const { messages: t } = useI18n();
  const l = t.settings.llm;
  const c = t.settings.common;
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
    reload().catch(() => setError(l.loadFailed));
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
      setInfo(l.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.error);
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
      setError(err instanceof Error ? err.message : l.testFailed);
    } finally {
      setTesting(false);
    }
  };

  const handleClearKey = async () => {
    if (!confirm(l.clearKeyConfirm)) return;
    setLoading(true);
    setError("");
    try {
      const s = await saveLlmSettings({ clear_user_key: true });
      setStatus(s);
      setApiKey("");
      setModel("");
      setTestResult(null);
      setInfo(l.usingBuiltinKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.error);
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
          <h3>{l.title}</h3>
          <p className="hint">
            {l.hintBefore}{" "}
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer">
              openrouter.ai
            </a>
          </p>
        </>
      )}

      <div className="status-grid">
        <div className="status-card">
          <span className="stat-label">{l.provider}</span>
          <span className="stat-value">{status.provider}</span>
        </div>
        <div className="status-card">
          <span className="stat-label">{l.key}</span>
          <span className={`stat-value ${status.key_source === "user" ? "ok" : ""}`}>
            {status.key_source === "user" ? `${l.keyUser} · ${status.user_key_masked}` : l.keyBuiltin}
          </span>
        </div>
        <div className="status-card wide">
          <span className="stat-label">{l.activeModel}</span>
          <code className="stat-code">{status.active_model}</code>
        </div>
      </div>

      {error && <p className="llm-error">{error}</p>}
      {info && !error && <p className="llm-info">{info}</p>}

      <form className="llm-form" onSubmit={handleSave}>
        <label>
          {l.apiKeyLabel} <span className="opt">{c.optional}</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-…"
            autoComplete="off"
          />
        </label>
        <label className={!canEditModel ? "disabled" : ""}>
          {l.customModel}
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={status.default_model}
            disabled={!canEditModel}
          />
          {!canEditModel && (
            <span className="field-hint">{l.customModelHint}</span>
          )}
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || testing}>
            {loading ? c.saving : c.save}
          </button>
          <button type="button" className="btn-secondary" onClick={handleTest} disabled={loading || testing}>
            {testing ? c.testing : c.test}
          </button>
          {status.has_user_key && (
            <button type="button" className="btn-ghost" onClick={handleClearKey} disabled={loading || testing}>
              {l.clearKey}
            </button>
          )}
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? "ok" : "fail"}`}>
            <p className="test-title">{testResult.success ? l.testPassed : l.testFailedTitle}</p>
            <p>{testResult.message}</p>
            <p className="test-meta">
              <code>{testResult.model}</code>
              {testResult.latency_ms != null && ` · ${testResult.latency_ms} ${l.ms}`}
            </p>
            {testResult.reply_preview && <pre className="test-preview">{testResult.reply_preview}</pre>}
          </div>
        )}
      </form>

      <style>{`
        .llm-settings h3 { margin: 0 0 0.35rem; font-size: 1rem; }
        .llm-settings .stat-code {
          display: block;
          font-size: 0.8rem;
          color: #c4b5fd;
          word-break: break-all;
        }
        .llm-settings .llm-error {
          color: #f87171;
          font-size: 0.85rem;
          padding: 0.55rem 0.75rem;
          background: rgba(248, 113, 113, 0.08);
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }
        .llm-settings .llm-info {
          color: #60a5fa;
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }
        .llm-settings .llm-form label.disabled { opacity: 0.65; }
        .llm-settings .llm-form input:focus {
          outline: none;
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
        }
        .llm-settings .llm-form input:disabled { opacity: 0.5; cursor: not-allowed; }
        .llm-settings .opt { font-weight: 400; opacity: 0.75; }
        .llm-settings .field-hint { display: block; margin-top: 0.25rem; font-size: 0.72rem; }
        .llm-settings .form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .llm-settings .btn-primary {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          border: none;
          color: #fff;
          padding: 0.6rem 1.1rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font: inherit;
        }
        .llm-settings .btn-secondary {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 0.6rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          font: inherit;
        }
        .llm-settings .btn-ghost {
          background: transparent;
          border: none;
          color: var(--muted);
          padding: 0.6rem 0.75rem;
          cursor: pointer;
          font: inherit;
          font-size: 0.85rem;
        }
        .llm-settings .btn-ghost:hover { color: #f87171; }
        .llm-settings button:disabled { opacity: 0.55; cursor: not-allowed; }
        .llm-settings .test-result {
          margin-top: 1rem;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          font-size: 0.88rem;
          line-height: 1.45;
        }
        .llm-settings .test-result.ok {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
        .llm-settings .test-result.fail {
          background: rgba(248, 113, 113, 0.08);
          border: 1px solid rgba(248, 113, 113, 0.35);
        }
        .llm-settings .test-title { font-weight: 600; margin: 0 0 0.25rem; }
        .llm-settings .test-result p { margin: 0.15rem 0; }
        .llm-settings .test-meta { color: var(--muted); font-size: 0.8rem; }
        .llm-settings .test-preview {
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
