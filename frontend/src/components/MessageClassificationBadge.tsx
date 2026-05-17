import { MessageClassification } from "../api";

function pct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

function statusLabel(c: MessageClassification): string {
  if (c.status === "processing") return "Обработка…";
  if (c.status === "error") return "Ошибка анализа";
  if (c.status === "pending") return "Ожидает анализа";
  if (c.status === "prefilter_skip") return "Отфильтровано правилами";
  if (c.status === "no_signals") return "Без сигналов для LLM";
  if (c.is_task && c.task_created) return "Задача создана";
  if (c.is_task) return "Классификатор: задача";
  return "Не задача";
}

export function MessageClassificationBadge({
  classification,
}: {
  classification?: MessageClassification | null;
}) {
  const c: MessageClassification =
    classification ?? {
      status: "pending",
      is_task: null,
      confidence: null,
      ai_confidence: null,
      heuristic_score: null,
      threshold: null,
      reason: null,
      prefilter_reason: null,
      task_created: false,
    };

  let variant: "task" | "not_task" | "pending" | "skip" | "processing" | "error" = "pending";
  if (c.status === "processing") variant = "processing";
  else if (c.status === "error") variant = "error";
  else if (c.status === "prefilter_skip" || c.status === "no_signals") variant = "skip";
  else if (c.status === "pending") variant = "pending";
  else if (c.is_task) variant = "task";
  else variant = "not_task";

  const icon =
    variant === "processing" ? (
      <span className="cls-spinner" aria-hidden />
    ) : variant === "task" ? (
      "✓"
    ) : variant === "not_task" ? (
      "✕"
    ) : variant === "skip" ? (
      "—"
    ) : variant === "error" ? (
      "!"
    ) : (
      "…"
    );

  const tooltipLines = [
    statusLabel(c),
    "",
    `Статус: ${c.status}`,
    c.is_task != null ? `Задача (классификатор): ${c.is_task ? "да" : "нет"}` : null,
    c.confidence != null ? `Итоговый score: ${pct(c.confidence)} (${c.confidence?.toFixed(2)})` : null,
    c.ai_confidence != null
      ? `AI confidence: ${pct(c.ai_confidence)} (${c.ai_confidence?.toFixed(2)})`
      : null,
    c.heuristic_score != null
      ? `Эвристика: ${pct(c.heuristic_score)} (${c.heuristic_score?.toFixed(2)})`
      : null,
    c.threshold != null ? `Порог (AI): ${pct(c.threshold)}` : null,
    c.task_created ? "Карточка в Inbox: да" : "Карточка в Inbox: нет",
    !c.task_created && c.is_task && c.skip_reason === "ai_below_threshold"
      ? "Не создано: AI confidence ниже порога"
      : null,
    !c.task_created &&
    c.is_task &&
    c.ai_confidence != null &&
    c.threshold != null &&
    c.ai_confidence >= c.threshold
      ? "Не создано ранее — нажмите «Создать задачу» или отправьте сообщение снова"
      : null,
    c.prefilter_reason ? `Фильтр: ${c.prefilter_reason}` : null,
    c.reason && c.status === "classified" ? `Причина: ${c.reason}` : null,
  ].filter(Boolean) as string[];

  return (
    <span className={`cls-badge cls-${variant}`} tabIndex={0}>
      <span className="cls-icon" aria-hidden>
        {typeof icon === "string" ? icon : icon}
      </span>
      <span className="cls-tooltip" role="tooltip">
        {tooltipLines.map((line, i) =>
          line === "" ? <br key={`br-${i}`} /> : <span key={i}>{line}</span>
        )}
      </span>
      <style>{`
        .cls-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 50%;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: help;
          flex-shrink: 0;
        }
        .cls-task { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.5); }
        .cls-not_task { background: rgba(148, 163, 184, 0.15); color: var(--muted); border: 1px solid var(--border); }
        .cls-pending { background: rgba(96, 165, 250, 0.15); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.4); }
        .cls-skip { background: rgba(251, 191, 36, 0.12); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.35); }
        .cls-processing { background: rgba(96, 165, 250, 0.2); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.55); }
        .cls-error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.45); }
        .cls-spinner {
          width: 0.75rem;
          height: 0.75rem;
          border: 2px solid rgba(96, 165, 250, 0.35);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: cls-spin 0.7s linear infinite;
        }
        @keyframes cls-spin { to { transform: rotate(360deg); } }
        .cls-tooltip {
          display: none;
          position: absolute;
          right: 0;
          top: calc(100% + 6px);
          z-index: 20;
          min-width: 220px;
          max-width: 320px;
          padding: 0.55rem 0.65rem;
          background: #1e293b;
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          color: #e2e8f0;
          font-size: 0.75rem;
          font-weight: 400;
          line-height: 1.45;
          text-align: left;
          white-space: normal;
          pointer-events: none;
        }
        .cls-badge:hover .cls-tooltip,
        .cls-badge:focus .cls-tooltip,
        .cls-badge:focus-within .cls-tooltip {
          display: block;
        }
      `}</style>
    </span>
  );
}
