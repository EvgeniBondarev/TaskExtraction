import { apiFetch } from "./http";
import { getStoredUtm, getVisitSessionId, getVisitorId } from "../utils/utm";

const API = import.meta.env.VITE_API_URL || "";

let visitSent = false;
const EVENT_SENT_PREFIX = "te_analytics_event_sent:";

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
): Promise<void> {
  const eventKey = `${EVENT_SENT_PREFIX}${eventType}`;
  try {
    // Status is read more than once during a normal UI session.  Marking the
    // event after a successful request prevents that read from becoming a new
    // login/registration in the analytics dashboard.
    if (sessionStorage.getItem(eventKey)) return;
  } catch {
    // Tracking is best-effort; the backend keeps registrations idempotent too.
  }
  const utm = getStoredUtm();
  try {
    const response = await apiFetch(`${API}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        visitor_id: getVisitorId(),
        ...utm,
      }),
    });
    if (response.ok) {
      try { sessionStorage.setItem(eventKey, "1"); } catch { /* ignore */ }
    }
  } catch {
    /* ignore */
  }
}
