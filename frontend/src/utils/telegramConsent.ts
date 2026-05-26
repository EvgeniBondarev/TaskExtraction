const CONSENT_KEY = "te_telegram_consent_v1";

export function hasTelegramConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTelegramConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    /* ignore */
  }
}
