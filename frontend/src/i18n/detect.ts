import type { Locale } from "./types";

const STORAGE_KEY = "te_lang";

export function readStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "ru" || v === "en") return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

/** Prefer English for en-* browser languages; default Russian. */
export function detectLocaleFromBrowser(): Locale {
  const langs: string[] =
    typeof navigator !== "undefined" && navigator.languages?.length
      ? [...navigator.languages]
      : typeof navigator !== "undefined" && navigator.language
        ? [navigator.language]
        : [];

  for (const raw of langs) {
    const code = (raw || "").toLowerCase();
    if (code.startsWith("en")) return "en";
    if (code.startsWith("ru")) return "ru";
  }
  return "ru";
}

export function resolveInitialLocale(): Locale {
  return readStoredLocale() ?? detectLocaleFromBrowser();
}
