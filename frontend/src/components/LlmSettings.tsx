import { CheckCircle, Key, Lightning, WarningCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { fetchLlmStatus, LlmStatus, LlmTestResult, saveLlmSettings, testLlmSettings } from "../api/llm";
import { useI18n } from "../i18n";
import { SettingsFormSkeleton } from "./PageSkeletons";

/** Примеры моделей OpenRouter для быстрого заполнения поля. */
const MODEL_EXAMPLES = ["openai/gpt-4o-mini", "google/gemini-2.0-flash-001", "anthropic/claude-3.5-haiku"];

export function LlmSettings(_props: { embedded?: boolean } = {}) {
  const { messages: t } = useI18n();
  const l = t.settings.llm;
  const c = t.settings.common;
  const pl = t.panel.settings.llm;
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
  }, [reload, l.loadFailed]);

  const canEditModel = Boolean(status?.has_user_key) || apiKey.trim().length > 0;

  const body = () => {
    const b: { api_key?: string; model?: string } = {};
    if (apiKey.trim()) b.api_key = apiKey.trim();
    if (canEditModel && model.trim()) b.model = model.trim();
    return b;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const s = await saveLlmSettings(body());
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
      const result = await testLlmSettings(body());
      setTestResult(result);
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
    return error ? <p className="te-alert te-alert--error">{error}</p> : <SettingsFormSkeleton fields={2} />;
  }

  const examples = Array.from(new Set([status.default_model, ...MODEL_EXAMPLES].filter(Boolean)));

  return (
    <div className="te-stack">
      <section className="te-panel">
        <h3 className="te-panel__title">{pl.statusTitle}</h3>
        <dl className="te-kv">
          <div>
            <dt>{l.provider}</dt>
            <dd>{status.provider}</dd>
          </div>
          <div>
            <dt>{l.key}</dt>
            <dd>
              {status.key_source === "user" ? (
                <>
                  <span className="te-dot-ok" aria-hidden /> {l.keyUser} <code>{status.user_key_masked}</code>
                </>
              ) : (
                l.keyBuiltin
              )}
            </dd>
          </div>
          <div className="te-kv__wide">
            <dt>{l.activeModel}</dt>
            <dd>
              <code>{status.active_model}</code>
            </dd>
          </div>
        </dl>
      </section>

      <form className="te-panel" onSubmit={handleSave}>
        <label className="te-field">
          <span className="te-field__label">
            <Key size={16} aria-hidden /> {pl.keyTitle}
          </span>
          <span className="te-field__hint">{pl.keyLead}</span>
          <input
            className="te-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={status.has_user_key ? `${status.user_key_masked ?? ""}` : "sk-or-v1-…"}
            autoComplete="off"
          />
          <span className="te-field__hint">
            {pl.keyHelp}{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
              openrouter.ai/keys
            </a>
          </span>
        </label>

        <label className="te-field">
          <span className="te-field__label">{pl.modelTitle}</span>
          <span className="te-field__hint">{pl.modelLead}</span>
          <input
            className="te-input te-input--mono"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={status.default_model}
            disabled={!canEditModel}
          />
          {canEditModel ? (
            <span className="te-examples">
              <span>{pl.examples}:</span>
              {examples.map((id) => (
                <button key={id} type="button" className="te-chip te-chip--sm" onClick={() => setModel(id)}>
                  {id}
                </button>
              ))}
            </span>
          ) : (
            <span className="te-field__hint">{l.customModelHint}</span>
          )}
        </label>

        {error && <p className="te-alert te-alert--error">{error}</p>}
        {info && !error && <p className="te-alert te-alert--ok">{info}</p>}

        <div className="te-panel__actions">
          <button type="submit" className="te-btn te-btn--primary" disabled={loading || testing}>
            {loading ? c.saving : c.save}
          </button>
          <button type="button" className="te-btn te-btn--ghost" onClick={handleTest} disabled={loading || testing}>
            <Lightning size={16} aria-hidden />
            {testing ? c.testing : c.test}
          </button>
          {status.has_user_key && (
            <button type="button" className="te-btn te-btn--danger-ghost" onClick={handleClearKey} disabled={loading || testing}>
              {l.clearKey}
            </button>
          )}
        </div>
        <p className="te-field__hint">{pl.testLead}</p>

        {testResult && (
          <div className={`te-result${testResult.success ? " is-ok" : " is-fail"}`} role="status">
            <strong>
              {testResult.success ? <CheckCircle size={18} weight="fill" aria-hidden /> : <WarningCircle size={18} weight="fill" aria-hidden />}
              {testResult.success ? l.testPassed : l.testFailedTitle}
            </strong>
            <p>{testResult.message}</p>
            <p className="te-muted">
              <code>{testResult.model}</code>
              {testResult.latency_ms != null && ` · ${testResult.latency_ms} ${l.ms}`}
            </p>
            {testResult.reply_preview && <pre>{testResult.reply_preview}</pre>}
          </div>
        )}
      </form>
    </div>
  );
}
