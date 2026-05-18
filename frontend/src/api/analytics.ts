import { apiFetch } from "./http";
import { getStoredUtm, getVisitSessionId, getVisitorId } from "../utils/utm";

const API = import.meta.env.VITE_API_URL || "";

let visitSent = false;

export async function trackVisit(landingPath?: string): Promise<void> {
  if (visitSent) return;
  visitSent = true;
  const utm = getStoredUtm();
  try {
    await apiFetch(`${API}/api/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id: getVisitorId(),
        session_id: getVisitSessionId(),
        ...utm,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        landing_path: landingPath || window.location.pathname + window.location.search,
      }),
    });
  } catch {
    visitSent = false;
  }
}

export async function trackAnalyticsEvent(
  eventType: "registration" | "login" | "setup_complete",
  tenantApiId?: string | number | null
): Promise<void> {
  const utm = getStoredUtm();
  try {
    await apiFetch(`${API}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        visitor_id: getVisitorId(),
        tenant_api_id: tenantApiId != null ? String(tenantApiId) : null,
        ...utm,
      }),
    });
  } catch {
    /* ignore */
  }
}
