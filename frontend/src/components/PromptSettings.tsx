import { useCallback, useEffect, useState } from "react";
import {
  fetchPromptSettings,
  PromptSettings as PromptConfig,
  resetPromptSettings,
  savePromptSettings,
} from "../api/llm";
import { SettingsFormSkeleton } from "./PageSkeletons";
import { useI18n } from "../i18n";

export function PromptSettings({ embedded }: { embedded?: boolean } = {}) {
  const { messages: t } = useI18n();
  const p = t.settings.prompts;
  const c = t.settings.common;
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
      .catch(() => setError(p.loadFailed))
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
      setInfo(p.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(p.resetConfirm)) return;
    setLoading(true);
    try {
      const s = await resetPromptSettings();
      setClassifier(s.classifier_system);
      setExtractor(s.extractor_system);
      setUserTemplate(s.extractor_user_template);
      setConfidence(s.confidence_threshold);
      setReview(s.review_threshold);
      setCfg(s);
      setInfo(p.resetDone);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.error);
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
      {!embedded ? (
        <>
          <h3>
            {p.title}
            {cfg?.using_defaults && <span className="badge">{p.defaultsBadge}</span>}
          </h3>
          <p className="hint">{p.hint}</p>
        </>
      ) : (
        cfg?.using_defaults && (
          <p className="prompts-defaults-note">
            <span className="badge">{p.defaultsBadge}</span>
          </p>
        )
      )}

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <form onSubmit={handleSave}>
        <label>
          {p.confidenceLabel}
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
          {p.reviewLabel}
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
          {p.classifierLabel}
          <textarea
            value={classifier}
            onChange={(e) => setClassifier(e.target.value)}
            rows={6}
            spellCheck={false}
          />
        </label>
        <label>
          {p.extractorLabel}
          <textarea value={extractor} onChange={(e) => setExtractor(e.target.value)} rows={6} spellCheck={false} />
        </label>
        <label>
          {p.userTemplateLabel}
          <textarea
            value={userTemplate}
            onChange={(e) => setUserTemplate(e.target.value)}
            rows={4}
            spellCheck={false}
          />
        </label>
        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? c.saving : p.savePrompts}
          </button>
          <button type="button" className="secondary" onClick={handleReset} disabled={loading}>
            {c.reset}
          </button>
        </div>
      </form>

    </section>
  );
}
