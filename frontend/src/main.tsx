import React from "react";
import ReactDOM from "react-dom/client";
import { SEO_PAGE_BY_PATH } from "./content/seoPages";
import { PRICING_PATH } from "./content/pricing";
import { I18nProvider } from "./i18n";
import { applyThemePref, readThemePref } from "./utils/theme";
import "./index.css";
import "./styles/brand.css";
import "./styles/lang-switch.css";
import "./styles/taste-retheme.css";

applyThemePref(readThemePref());

const pathname = window.location.pathname;
const seoPath = pathname.endsWith("/") ? pathname : `${pathname}/`;

// Каждый маршрут подгружает только свой код: публичные SEO-страницы не тянут приложение и админку.
// Статическая разметка из index.html остаётся на экране, пока нужный чанк не загрузится.
async function loadRoot(): Promise<React.ReactElement> {
  // Только в dev: страница для снимков лендинга (scripts/capture-landing-shots.sh), в прод-бандл не попадает.
  if (import.meta.env.DEV && pathname.startsWith("/__shots")) {
    const { default: ShotsPage } = await import("./dev/ShotsPage");
    return <ShotsPage />;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const { AdminApp } = await import("./pages/AdminApp");
    return <AdminApp />;
  }
  if (seoPath === PRICING_PATH) {
    const { PricingPage } = await import("./pages/PricingPage");
    return <PricingPage />;
  }
  if (SEO_PAGE_BY_PATH.has(seoPath)) {
    const { SeoContentPage } = await import("./pages/SeoContentPage");
    return <SeoContentPage />;
  }
  const { default: App } = await import("./App");
  return <App />;
}

void loadRoot().then((root) => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <I18nProvider>{root}</I18nProvider>
    </React.StrictMode>,
  );
});
