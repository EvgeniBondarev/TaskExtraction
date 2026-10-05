/** Короткая метка времени: «5 мин назад», «3 ч назад», иначе «5 окт., 10:14». */
export function formatShortTime(iso: string | null | undefined, locale: "ru" | "en"): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const tag = locale === "en" ? "en-US" : "ru-RU";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin >= 0 && diffMin < 60 * 12) {
    const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto", style: "short" });
    if (diffMin < 1) return rtf.format(0, "minute");
    if (diffMin < 60) return rtf.format(-diffMin, "minute");
    return rtf.format(-Math.round(diffMin / 60), "hour");
  }
  return date.toLocaleString(tag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatFullTime(iso: string | null | undefined, locale: "ru" | "en"): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(locale === "en" ? "en-US" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
