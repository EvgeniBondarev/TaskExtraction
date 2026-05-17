import { useCallback, useEffect, useState } from "react";
import {
  fetchPromptSettings,
  PromptSettings as PromptConfig,
  resetPromptSettings,
  savePromptSettings,
} from "../api/llm";
import { SettingsFormSkeleton } from "./PageSkeletons";

export function PromptSettings({ embedded }: { embedded?: boolean } = {}) {
  const [cfg, setCfg] = useState<PromptConfig | null>(null);
  const [classifier, setClassifier] = useState("");
  const [extractor, setExtractor] = useState("");
  const [userTemplate, setUserTemplate] = useState("");
  const [confidence, setConfidence] = useState(0.75);
  const [review, setReview] = useState(0.5);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const reload = useCallback(async () => {
    const s = await fetchPromptSettings();
    setCfg(s);
    setClassifier(s.classifier_system);
    setExtractor(s.extractor_system);
    setUserTemplate(s.extractor_user_template);
    setConfidence(s.confidence_threshold);
    setReview(s.review_threshold);
  }, []);

  useEffect(() => {
    setInitialLoading(true);
    reload()
      .catch(() => setError("Не удалось загрузить промпты"))
      .finally(() => setInitialLoading(false));
  }, [reload]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const s = await savePromptSettings({
        classifier_system: classifier,
        extractor_system: extractor,
        extractor_user_template: userTemplate,
        confidence_threshold: confidence,
        review_threshold: review,
      });
      setCfg(s);
      setInfo("Промпты сохранены");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Сбросить промпты к значениям по умолчанию?")) return;
    setLoading(true);
    try {
      const s = await resetPromptSettings();
      setClassifier(s.classifier_system);
      setExtractor(s.extractor_system);
      setUserTemplate(s.extractor_user_template);
      setConfidence(s.confidence_threshold);
      setReview(s.review_threshold);
      setCfg(s);
      setInfo("Промпты сброшены");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <section className={embedded ? "card prompts-card embedded" : "card prompts-card"}>
        <SettingsFormSkeleton fields={4} />
      </section>
    );
  }

  return (
    <section className={embedded ? "card prompts-card embedded" : "card prompts-card"}>
      <h3>
        Промпты и пороги
        {cfg?.using_defaults && <span className="badge">по умолчанию</span>}
      </h3>
      <p className="hint">
        Двухэтапный пайплайн: сначала классификатор (мало токенов), затем извлечение карточки задачи.
        Порог confidence — минимальный итоговый score для создания задачи в Inbox.
      </p>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <form onSubmit={handleSave}>
        <label>
          Порог auto-create (confidence)
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
          />
        </label>
        <label>
          Порог review (зарезервировано)
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={review}
            onChange={(e) => setReview(Number(e.target.value))}
          />
        </label>
        <label>
          Классификатор (system)
          <textarea
            value={classifier}
            onChange={(e) => setClassifier(e.target.value)}
            rows={6}
            spellCheck={false}
          />
        </label>
        <label>
          Извлечение задачи (system)
          <textarea value={extractor} onChange={(e) => setExtractor(e.target.value)} rows={6} spellCheck={false} />
        </label>
        <label>
          Шаблон user (плейсхолдеры: {"{context}"}, {"{message_id}"}, {"{text}"})
          <textarea
            value={userTemplate}
            onChange={(e) => setUserTemplate(e.target.value)}
            rows={4}
            spellCheck={false}
          />
        </label>
        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? "Сохранение…" : "Сохранить промпты"}
          </button>
          <button type="button" className="secondary" onClick={handleReset} disabled={loading}>
            Сбросить
          </button>
        </div>
      </form>

      <style>{`
        .prompts-card { margin-bottom: 1rem; }
        .prompts-card h3 { margin: 0 0 0.75rem; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; }
        .badge { font-size: 0.7rem; font-weight: normal; color: var(--muted); border: 1px solid var(--border); padding: 0.1rem 0.4rem; border-radius: 4px; }
        .prompts-card .hint { color: var(--muted); font-size: 0.85rem; margin: 0 0 0.75rem; }
        .prompts-card label { display: block; margin-bottom: 0.75rem; font-size: 0.8rem; color: var(--muted); }
        .prompts-card .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.35rem; }
        .prompts-card button {
          background: var(--accent); border: none; color: #fff;
          padding: 0.55rem 1rem; border-radius: 8px; cursor: pointer; font: inherit;
        }
        .prompts-card button.secondary {
          background: transparent; border: 1px solid var(--border); color: var(--text);
        }
        .prompts-card .error { color: #f87171; }
        .prompts-card .info { color: #60a5fa; font-size: 0.9rem; }
        .prompts-card textarea {
          display: block; width: 100%; margin-top: 0.25rem;
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); border-radius: 8px; padding: 0.5rem;
          font-family: ui-monospace, monospace; font-size: 0.78rem; line-height: 1.4;
        }
        .prompts-card input[type="number"] {
          display: block; width: 120px; margin-top: 0.25rem;
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); border-radius: 8px; padding: 0.45rem;
        }
      `}</style>
    </section>
  );
}
