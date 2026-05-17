import { apiFetch } from "./http";

const API = import.meta.env.VITE_API_URL || "";

/** Выйти из панели: сброс cookie-сессии, данные на сервере сохраняются. */
export async function logoutPanel(): Promise<void> {
  const r = await apiFetch(`${API}/api/session/logout`, { method: "POST" });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Не удалось выйти из панели");
  }
}
