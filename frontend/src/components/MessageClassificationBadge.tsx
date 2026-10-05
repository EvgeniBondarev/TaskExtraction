import { CheckCircle, CircleNotch, Lightbulb, MinusCircle, Warning, Hourglass, Funnel } from "@phosphor-icons/react";
import { MessageClassification } from "../api";
import { useI18n } from "../i18n";

export type ClassificationVariant = "created" | "candidate" | "not_task" | "pending" | "skip" | "processing" | "error";

export function classificationVariant(c?: MessageClassification | null): ClassificationVariant {
  if (!c || c.status === "pending") return "pending";
  if (c.status === "processing") return "processing";
  if (c.status === "error") return "error";
  if (c.status === "prefilter_skip" || c.status === "no_signals") return "skip";
  if (c.is_task && c.task_created) return "created";
  if (c.is_task) return "candidate";
  return "not_task";
}

const ICONS = {
  created: CheckCircle,
  candidate: Lightbulb,
  not_task: MinusCircle,
  pending: Hourglass,
  skip: Funnel,
  processing: CircleNotch,
  error: Warning,
} as const;

/** Статус разбора сообщения: короткая подпись текстом, без тултипов-загадок. */
export function MessageClassificationBadge({ classification }: { classification?: MessageClassification | null }) {
  const { messages } = useI18n();
  const s = messages.panel.feed.status;
  const variant = classificationVariant(classification);
  const Icon = ICONS[variant];
  const label = {
    created: s.created,
    candidate: s.candidate,
    not_task: s.notTask,
    pending: s.pending,
    skip: s.skip,
    processing: s.processing,
    error: s.error,
  }[variant];

  return (
    <span className={`te-status te-status--${variant}`}>
      <Icon size={14} weight={variant === "created" ? "fill" : "bold"} className={variant === "processing" ? "te-spin" : undefined} aria-hidden />
      {label}
    </span>
  );
}
