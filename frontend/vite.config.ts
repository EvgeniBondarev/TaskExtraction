import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function seoSitePlugin(siteUrl: string): Plugin {
  const base = (siteUrl || "http://localhost:5173").replace(/\/$/, "");

  const replacePlaceholders = (content: string) =>
    content.replaceAll("__SITE_URL__", base);

  return {
    name: "seo-site-url",
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

  return {
    plugins: [react(), seoSitePlugin(siteUrl)],
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:8000",
        "/ws": { target: "ws://localhost:8000", ws: true },
      },
    },
  };
});
