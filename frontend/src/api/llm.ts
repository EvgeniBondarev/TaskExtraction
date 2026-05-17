const API = import.meta.env.VITE_API_URL || "";
import { apiFetch } from "./http";

export interface LlmStatus {
  provider: string;
  base_url: string;
  default_model: string;
  active_model: string;
  key_source: "builtin" | "user";
  has_user_key: boolean;
  user_key_masked: string | null;
  user_model: string | null;
  can_edit_model: boolean;
  is_configured: boolean;
}

export async function fetchLlmStatus(): Promise<LlmStatus> {
  const r = await apiFetch(`${API}/api/llm/status`);
  if (!r.ok) throw new Error("Failed to load LLM settings");
  return r.json();
}

export interface LlmTestResult {
  success: boolean;
  message: string;
  model: string;
  key_source: string;
  latency_ms: number | null;
  reply_preview: string | null;
}

export async function testLlmSettings(body?: {
  api_key?: string;
  model?: string;
}): Promise<LlmTestResult> {
  const r = await apiFetch(`${API}/api/llm/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error((data as { detail?: string }).detail || "Test failed");
  }
  return data as LlmTestResult;
}

export interface PromptSettings {
  classifier_system: string;
  extractor_system: string;
  extractor_user_template: string;
  confidence_threshold: number;
  review_threshold: number;
  using_defaults: boolean;
}

export async function fetchPromptSettings(): Promise<PromptSettings> {
  const r = await apiFetch(`${API}/api/llm/prompts`);
  if (!r.ok) throw new Error("Failed to load prompts");
  return r.json();
}

export async function savePromptSettings(body: Partial<PromptSettings>): Promise<PromptSettings> {
  const r = await apiFetch(`${API}/api/llm/prompts`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Save failed");
  }
  return r.json();
}

export async function resetPromptSettings(): Promise<PromptSettings> {
  const r = await apiFetch(`${API}/api/llm/prompts/reset`, { method: "POST" });
  if (!r.ok) throw new Error("Reset failed");
  return r.json();
}

export async function saveLlmSettings(body: {
  api_key?: string;
  model?: string;
  clear_user_key?: boolean;
}): Promise<LlmStatus> {
  const r = await apiFetch(`${API}/api/llm/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Save failed");
  }
  return r.json();
}
