import { Task } from "../api";

export const STATUS_ORDER = ["inbox", "in_progress", "done", "archive"] as const;

export const STATUS_LABELS: Record<string, string> = {
  inbox: "Inbox",
  in_progress: "В работе",
  done: "Готово",
  archive: "Архив",
};

export const STATUS_COLORS: Record<string, string> = {
  inbox: "#6366f1",
  in_progress: "#f59e0b",
  done: "#22c55e",
  archive: "#64748b",
};

export function statusIndex(status: string): number {
  const i = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
  return i >= 0 ? i : 0;
}

export function prevStatus(status: string): string | null {
  const i = statusIndex(status);
  return i > 0 ? STATUS_ORDER[i - 1] : null;
}

export function nextStatus(status: string): string | null {
  const i = statusIndex(status);
  return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null;
}

export function primaryAction(status: string): { label: string; next: string } | null {
  if (status === "inbox") return { label: "Взять в работу", next: "in_progress" };
  if (status === "in_progress") return { label: "Выполнить", next: "done" };
  if (status === "done") return { label: "В архив", next: "archive" };
  return null;
}

export function backActionLabel(status: string): string | null {
  if (status === "in_progress") return "Вернуть в Inbox";
  if (status === "done") return "Вернуть в работу";
  if (status === "archive") return "Вернуть в Готово";
  return null;
}

export const TYPE_LABELS: Record<string, string> = {
  bug: "Баг",
  feature: "Фича",
  question: "Вопрос",
  other: "Другое",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export function hasAttachments(task: Task): boolean {
  return (task.attachments?.length ?? 0) > 0;
}
