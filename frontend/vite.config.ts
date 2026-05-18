import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SEO, SITEMAP_PATHS } from "./seo.config";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function siteHost(siteUrl: string): string {
  try {
    return new URL(siteUrl).host;
  } catch {
    return "localhost";
  }
}

function buildSitemapXml(base: string, lastmod: string): string {
  const urls = SITEMAP_PATHS.map(
    (entry) => `  <url>
    <loc>${base}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function seoSitePlugin(siteUrl: string, isProd: boolean): Plugin {
  const base = (siteUrl || "http://localhost:5173").replace(/\/$/, "");
  const canonical = `${base}${SEO.welcomePath}`;
  const host = siteHost(base);
  const lastmod = new Date().toISOString().slice(0, 10);

  const yandexVerification = process.env.VITE_YANDEX_VERIFICATION?.trim() || "";
  const googleVerification = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim() || "";

  const yandexMeta = yandexVerification
    ? `    <meta name="yandex-verification" content="${escapeHtml(yandexVerification)}" />`
    : "";
  const googleMeta = googleVerification
    ? `    <meta name="google-site-verification" content="${escapeHtml(googleVerification)}" />`
    : "";

  const vars: Record<string, string> = {
    __SITE_URL__: base,
    __SITE_HOST__: host,
    __SEO_TITLE__: escapeHtml(SEO.title),
    __SEO_DESCRIPTION__: escapeHtml(SEO.description),
    __SEO_SHARE_TITLE__: escapeHtml(SEO.shareTitle),
    __SEO_SHARE_DESCRIPTION__: escapeHtml(SEO.shareDescription),
    __SEO_KEYWORDS__: escapeHtml(SEO.keywords),
    __SEO_OG_IMAGE_ALT__: escapeHtml(SEO.ogImageAlt),
    __SEO_CANONICAL__: canonical,
    __SEO_OG_IMAGE__: `${base}${SEO.ogImagePath}`,
    __SEO_OG_WIDTH__: String(SEO.ogImageWidth),
    __SEO_OG_HEIGHT__: String(SEO.ogImageHeight),
    __SEO_JSONLD_DESC__: escapeHtml(SEO.description),
    __SEO_JSONLD_URL__: canonical,
    __YANDEX_VERIFICATION_META__: yandexMeta,
    __GOOGLE_VERIFICATION_META__: googleMeta,
  };

  const replacePlaceholders = (content: string) => {
    let out = content;
    for (const [key, value] of Object.entries(vars)) {
      out = out.replaceAll(key, value);
    }
    return out;
  };

  return {
    name: "seo-site-url",
    configResolved() {
      if (isProd && (!siteUrl || base.includes("localhost"))) {
        console.warn(
          "\n⚠️  VITE_SITE_URL не задан или указывает на localhost.\n" +
            "   SEO (sitemap, canonical, OG) не будут корректны для продакшена.\n" +
            "   Соберите с: VITE_SITE_URL=https://task-extraction.ru npm run build\n",
        );
      }
    },
    transformIndexHtml(html) {
      return replacePlaceholders(html);
    },
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      writeFileSync(resolve(dist, "sitemap.xml"), buildSitemapXml(base, lastmod));

      const robotsPath = resolve(__dirname, "public/robots.txt");
      try {
        writeFileSync(
          resolve(dist, "robots.txt"),
          replacePlaceholders(readFileSync(robotsPath, "utf-8")),
        );
      } catch {
        /* ignore */
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const siteUrl = process.env.VITE_SITE_URL || "";
  const isProd = mode === "production";

  return {
    plugins: [react(), seoSitePlugin(siteUrl, isProd)],
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:8000",
        "/ws": { target: "ws://localhost:8000", ws: true },
      },
    },
  };
});
