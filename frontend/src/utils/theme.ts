import { useCallback, useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
export type ThemeTransitionOrigin = { x: number; y: number };

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

function persistThemePref(pref: ThemePref): void {
  try {
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
  applyThemePref(pref);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: pref }));
}

function isDark(pref: ThemePref): boolean {
  return pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

let themeTransitionActive = false;

/** Saves the preference with a browser-independent radial reveal from the chosen control. */
export function setThemePref(pref: ThemePref, origin?: ThemeTransitionOrigin): void {
  const root = document.documentElement;
  const nextScheme = isDark(pref) ? "dark" : "light";
  const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (themeTransitionActive) return;

  if (!origin || motionReduced || root.style.colorScheme === nextScheme) {
    persistThemePref(pref);
    return;
  }

  themeTransitionActive = true;
  root.style.setProperty("--theme-reveal-x", `${origin.x}px`);
  root.style.setProperty("--theme-reveal-y", `${origin.y}px`);
  root.classList.add("theme-transitioning");
  const previousScheme = root.style.colorScheme === "dark" ? "dark" : "light";
  const iris = document.createElement("span");
  iris.className = `te-theme-iris te-theme-iris--${previousScheme}`;
  iris.style.setProperty("--theme-reveal-x", `${origin.x}px`);
  iris.style.setProperty("--theme-reveal-y", `${origin.y}px`);
  document.body.append(iris);

  // Switch immediately: the previous surface closes into the pressed icon,
  // revealing the new UI inside the circle instead of showing a blank overlay.
  persistThemePref(pref);
  window.requestAnimationFrame(() => iris.classList.add("is-revealing"));
  window.setTimeout(() => {
    iris.remove();
    root.classList.remove("theme-transitioning");
    themeTransitionActive = false;
  }, 560);
}

export function useThemePref(): [ThemePref, (pref: ThemePref, origin?: ThemeTransitionOrigin) => void] {
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

  const update = useCallback((next: ThemePref, origin?: ThemeTransitionOrigin) => setThemePref(next, origin), []);
  return [pref, update];
}
