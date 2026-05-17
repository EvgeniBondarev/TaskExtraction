import { SEO } from "../../seo.config";

const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || "";

export const SITE = {
  ...SEO,
  shortTitle: SEO.siteName,
  welcomeTitle: SEO.shareTitle,
  welcomeDescription: SEO.shareDescription,
} as const;

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!siteUrl) return p;
  return `${siteUrl}${p}`;
}

export function pageTitle(suffix?: string): string {
  if (!suffix) return SITE.title;
  return `${suffix} · ${SITE.shortTitle}`;
}

export function hasPublicSiteUrl(): boolean {
  return siteUrl.startsWith("http");
}
