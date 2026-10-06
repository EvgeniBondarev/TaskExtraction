import { useCallback, useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";

const STORAGE_KEY = "te_theme";
const EVENT = "te-theme-change";

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  // A calm light surface is the product default. Explicit selections remain persisted.
  return "light";
}

/** Ставит data-theme на <html>; "system" снимает атрибут и отдаёт выбор prefers-color-scheme. */
export function applyThemePref(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function setThemePref(pref: ThemePref): void {
  try {
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
  applyThemePref(pref);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: pref }));
}

export function useThemePref(): [ThemePref, (pref: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(readThemePref);

  useEffect(() => {
    const onChange = (e: Event) => setPref((e as CustomEvent<ThemePref>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => applyThemePref("system");
    mq.addEventListener("change", onSystem);
    return () => mq.removeEventListener("change", onSystem);
  }, [pref]);

  const update = useCallback((next: ThemePref) => setThemePref(next), []);
  return [pref, update];
}
