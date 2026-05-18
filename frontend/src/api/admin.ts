import { apiFetch } from "./http";

const API = import.meta.env.VITE_API_URL || "";

export interface AdminStats {
  period: { from: string; to: string; days: number };
  totals: {
    visits: number;
    unique_visitors: number;
    registrations: number;
    logins: number;
    setup_complete: number;
    conversion_pct: number;
  };
  by_source: Array<{
    utm_source: string;
    visits: number;
    unique_visitors: number;
    registrations: number;
    conversion_pct: number;
  }>;
  by_medium: Array<{ utm_medium: string; visits: number }>;
  by_campaign: Array<{ utm_campaign: string; utm_source: string; visits: number }>;
}

export interface TimeseriesPoint {
  date: string;
  count: number;
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const r = await apiFetch(`${API}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error((d as { detail?: string }).detail || "Ошибка входа");
  }
}

export async function adminLogout(): Promise<void> {
  await apiFetch(`${API}/api/admin/logout`, { method: "POST" });
}

export async function adminCheck(): Promise<boolean> {
  const r = await apiFetch(`${API}/api/admin/me`);
  return r.ok;
}

export async function fetchAdminStats(days = 30): Promise<AdminStats> {
  const r = await apiFetch(`${API}/api/admin/stats?days=${days}`);
  if (!r.ok) throw new Error("Не удалось загрузить статистику");
  return r.json();
}

export async function fetchAdminTimeseries(
  metric: "visits" | "registrations" | "logins",
  days = 30
): Promise<TimeseriesPoint[]> {
  const r = await apiFetch(`${API}/api/admin/stats/timeseries?metric=${metric}&days=${days}`);
  if (!r.ok) throw new Error("Не удалось загрузить график");
  const data = await r.json();
  return data.points as TimeseriesPoint[];
}
