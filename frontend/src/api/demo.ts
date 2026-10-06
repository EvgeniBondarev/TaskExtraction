import { apiFetch } from "./http";

const API = import.meta.env.VITE_API_URL || "";

export type DemoVerdict = "task" | "candidate" | "not_task" | "noise";

export interface DemoClassifyResult {
  verdict: DemoVerdict;
  confidence: number | null;
  threshold: number;
  reason: string | null;
  title: string | null;
  description: string | null;
  type: string | null;
  priority: string | null;
  has_deadline: boolean | null;
  requires_review: boolean;
}

/** Публичный разбор сообщения тем же пайплайном, что и в панели (без сохранения). */
export async function classifyDemoMessage(text: string): Promise<DemoClassifyResult> {
  const r = await apiFetch(`${API}/api/demo/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) {
    let detail = "";
    try {
      const data = await r.json();
      detail = typeof data.detail === "string" ? data.detail : "";
    } catch {
      /* ignore */
    }
    throw new DemoError(r.status, detail);
  }
  return r.json();
}

export class DemoError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
