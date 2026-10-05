import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AdminApp } from "./pages/AdminApp";
import { I18nProvider } from "./i18n";
import { applyThemePref, readThemePref } from "./utils/theme";
import "./index.css";
import "./styles/brand.css";
import "./styles/lang-switch.css";
import "./styles/taste-retheme.css";

applyThemePref(readThemePref());

// Только в dev: страница для снимков лендинга (scripts/capture-landing-shots.sh), в прод-бандл не попадает.
const ShotsPage = import.meta.env.DEV ? lazy(() => import("./dev/ShotsPage")) : null;
const isShotsRoute = ShotsPage !== null && window.location.pathname.startsWith("/__shots");

const isAdminRoute =
  window.location.pathname === "/admin" ||
  window.location.pathname.startsWith("/admin/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      {isShotsRoute && ShotsPage ? (
        <Suspense fallback={null}>
          <ShotsPage />
        </Suspense>
      ) : isAdminRoute ? (
        <AdminApp />
      ) : (
        <App />
      )}
    </I18nProvider>
  </React.StrictMode>
);
