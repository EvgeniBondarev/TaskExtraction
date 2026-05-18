const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const VISITOR_KEY = "te_visitor_id";
const SESSION_KEY = "te_visit_session";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

export function getVisitSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

export function captureUtmFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) {
        localStorage.setItem(key, value);
      }
    }
  } catch {
    /* ignore */
  }
}

export function getStoredUtm(): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
} {
  try {
    return {
      utm_source: localStorage.getItem("utm_source"),
      utm_medium: localStorage.getItem("utm_medium"),
      utm_campaign: localStorage.getItem("utm_campaign"),
      utm_content: localStorage.getItem("utm_content"),
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null };
  }
}
