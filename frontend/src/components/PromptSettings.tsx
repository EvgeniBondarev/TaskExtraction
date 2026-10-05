import { ArrowCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchPromptSettings,
  PromptSettings as PromptConfig,
  resetPromptSettings,
  savePromptSettings,
} from "../api/llm";
import { useI18n } from "../i18n";
import { SettingsFormSkeleton } from "./PageSkeletons";

const PLACEHOLDERS = ["{context}", "{message_id}", "{text}"];

export function PromptSettings(_props: { embedded?: boolean } = {}) {
  const { messages: t } = useI18n();
  const p = t.settings.prompts;
  const c = t.settings.common;
  const pp = t.panel.settings.prompts;
  const [cfg, setCfg] = useState<PromptConfig | null>(null);
  const [classifier, setClassifier] = useState("");
  const [extractor, setExtractor] = useState("");
  const [userTemplate, setUserTemplate] = useState("");
  const [confidence, setConfidence] = useState(0.75);
  const [review, setReview] = useState(0.5);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const apply = (s: PromptConfig) => {
    setCfg(s);
    setClassifier(s.classifier_system);
    setExtractor(s.extractor_system);
    setUserTemplate(s.extractor_user_template);
    setConfidence(s.confidence_threshold);
    setReview(s.review_threshold);
  };

  const reload = useCallback(async () => apply(await fetchPromptSettings()), []);

  useEffect(() => {
    reload().catch(() => setError(p.loadFailed));
  }, [reload, p.loadFailed]);

  const dirty =
    cfg !== null &&
    (classifier !== cfg.classifier_system ||
      extractor !== cfg.extractor_system ||
      userTemplate !== cfg.extractor_user_template ||
      confidence !== cfg.confidence_threshold ||
      review !== cfg.review_threshold);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      apply(
        await savePromptSettings({
          classifier_system: classifier,
          extractor_system: extractor,
          extractor_user_template: userTemplate,
          confidence_threshold: confidence,
          review_threshold: review,
        }),
      );
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
    setError("");
    try {
      apply(await resetPromptSettings());
      setInfo(p.resetDone);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.error);
    } finally {
      setLoading(false);
    }
  };

  if (!cfg) {
    return error ? <p className="te-alert te-alert--error">{error}</p> : <SettingsFormSkeleton fields={4} />;
  }

  const fmt = (n: number) => n.toFixed(2);

  return (
    <form className="te-stack" onSubmit={handleSave}>
      <section className="te-panel">
        <h3 className="te-panel__title">{pp.thresholdTitle}</h3>
        <p className="te-panel__lead">{pp.thresholdLead}</p>

        <div className="te-range">
          <input
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            aria-label={p.confidenceLabel}
            style={{ "--val": `${((confidence - 0.3) / 0.65) * 100}%` } as React.CSSProperties}
          />
          <output className="te-range__value">{fmt(confidence)}</output>
        </div>
        <div className="te-range__legend">
          <span>{pp.thresholdLow}</span>
          <span>{pp.thresholdHigh}</span>
        </div>

        <div className="te-threshold-demo">
          <span className="te-field__label">{pp.exampleTitle}</span>
          <ul>
            {pp.examples.map((ex) => {
              const pass = ex.score >= confidence;
              return (
                <li key={ex.text} className={pass ? "is-pass" : ""}>
                  <span className="te-threshold-demo__text">{ex.text}</span>
                  <span className="te-threshold-demo__score">{fmt(ex.score)}</span>
                  <span className={`te-status ${pass ? "te-status--created" : "te-status--not_task"}`}>
                    {pass ? pp.becomesTask : pp.staysInFeed}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="te-panel">
        <label className="te-field te-field--inline">
          <span>
            <span className="te-field__label">{pp.reviewTitle}</span>
            <span className="te-field__hint">{pp.reviewLead}</span>
          </span>
          <input
            className="te-input te-input--num"
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={review}
            onChange={(e) => setReview(Number(e.target.value))}
          />
        </label>
      </section>

      <section className="te-panel">
        <h3 className="te-panel__title">{pp.promptsTitle}</h3>
        <p className="te-panel__lead">{pp.promptsLead}</p>

        {[
          { id: "classifier", label: p.classifierLabel, hint: pp.classifierHint, value: classifier, set: setClassifier, initial: cfg.classifier_system, rows: 8 },
          { id: "extractor", label: p.extractorLabel, hint: pp.extractorHint, value: extractor, set: setExtractor, initial: cfg.extractor_system, rows: 8 },
          { id: "template", label: p.userTemplateLabel.split(" (")[0], hint: pp.templateHint, value: userTemplate, set: setUserTemplate, initial: cfg.extractor_user_template, rows: 5 },
        ].map((item) => (
          <details key={item.id} className="te-disclosure">
            <summary>
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              {item.value !== item.initial && <span className="te-tag te-tag--accent">{pp.edited}</span>}
              <CaretDown size={14} weight="bold" aria-hidden />
            </summary>
            {item.id === "template" && (
              <span className="te-examples">
                {PLACEHOLDERS.map((ph) => (
                  <code key={ph}>{ph}</code>
                ))}
              </span>
            )}
            <textarea
              className="te-textarea te-textarea--mono"
              value={item.value}
              onChange={(e) => item.set(e.target.value)}
              rows={item.rows}
              spellCheck={false}
              aria-label={item.label}
            />
          </details>
        ))}
      </section>

      {error && <p className="te-alert te-alert--error">{error}</p>}
      {info && !error && <p className="te-alert te-alert--ok">{info}</p>}

      <div className={`te-savebar${dirty ? " te-glass is-dirty" : ""}`}>
        <span className="te-muted">{cfg.using_defaults && !dirty ? p.defaultsBadge : dirty ? pp.edited : ""}</span>
        <button type="button" className="te-btn te-btn--ghost" onClick={handleReset} disabled={loading}>
          <ArrowCounterClockwise size={16} aria-hidden />
          {c.reset}
        </button>
        <button type="submit" className="te-btn te-btn--primary" disabled={loading || !dirty}>
          {loading ? c.saving : p.savePrompts}
        </button>
      </div>
    </form>
  );
}
