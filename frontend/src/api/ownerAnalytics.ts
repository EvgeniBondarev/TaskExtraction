import type { AdminStats, AdminUserRow, TimeseriesPoint } from "./admin";
import { apiFetch } from "./http";

const API = import.meta.env.VITE_API_URL || "";

export async function fetchOwnerAnalyticsAccess(): Promise<boolean> {
  const response = await apiFetch(`${API}/api/owner-analytics/access`);
  return response.ok;
}

export async function fetchOwnerAnalyticsStats(days = 30): Promise<AdminStats> {
  const response = await apiFetch(`${API}/api/owner-analytics/stats?days=${days}`);
  if (!response.ok) throw new Error("Не удалось загрузить аналитику");
  return response.json();
}

export async function fetchOwnerAnalyticsTimeseries(
  metric: "visits" | "registrations" | "logins",
  days = 30,
): Promise<TimeseriesPoint[]> {
  const response = await apiFetch(`${API}/api/owner-analytics/stats/timeseries?metric=${metric}&days=${days}`);
  if (!response.ok) throw new Error("Не удалось загрузить график");
  return (await response.json()).points as TimeseriesPoint[];
}

export async function fetchOwnerAnalyticsUsers(): Promise<{ total: number; users: AdminUserRow[] }> {
  const response = await apiFetch(`${API}/api/owner-analytics/users`);
  if (!response.ok) throw new Error("Не удалось загрузить список аккаунтов");
  return response.json();
}
