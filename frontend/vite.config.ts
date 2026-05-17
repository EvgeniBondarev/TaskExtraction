import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SEO } from "./seo.config";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function seoSitePlugin(siteUrl: string, isProd: boolean): Plugin {
  const base = (siteUrl || "http://localhost:5173").replace(/\/$/, "");
  const canonical = `${base}${SEO.welcomePath}`;

  const vars: Record<string, string> = {
    __SITE_URL__: base,
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
            "   Превью ссылок в Telegram/WhatsApp не будут работать снаружи.\n" +
            "   Соберите с: VITE_SITE_URL=https://ваш-домен npm run build\n",
        );
      }
    },
    transformIndexHtml(html) {
      return replacePlaceholders(html);
    },
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      for (const file of ["robots.txt", "sitemap.xml"]) {
        const path = resolve(dist, file);
        try {
          writeFileSync(path, replacePlaceholders(readFileSync(path, "utf-8")));
        } catch {
          /* файл может отсутствовать при частичной сборке */
        }
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
