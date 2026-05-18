import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./locales/en";
import ru from "./locales/ru";
import { detectLocaleFromBrowser, readStoredLocale, resolveInitialLocale, storeLocale } from "./detect";
import type { Locale, Messages } from "./types";

const catalogs: Record<Locale, Messages> = { ru, en };

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function applyDocumentLang(locale: Locale): void {
  document.documentElement.lang = locale === "en" ? "en" : "ru";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(resolveInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    storeLocale(next);
    setLocaleState(next);
  }, []);

  useEffect(() => {
    applyDocumentLang(locale);
  }, [locale]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "te_lang") return;
      const stored = readStoredLocale();
      if (stored) setLocaleState(stored);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages: catalogs[locale],
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Re-detect from browser when user clears stored preference (optional helper). */
export function useResetLocaleToBrowser(): () => void {
  const { setLocale } = useI18n();
  return useCallback(() => {
    try {
      localStorage.removeItem("te_lang");
    } catch {
      /* ignore */
    }
    setLocale(detectLocaleFromBrowser());
  }, [setLocale]);
}
