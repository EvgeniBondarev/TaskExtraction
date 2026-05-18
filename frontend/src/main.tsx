import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AdminApp } from "./pages/AdminApp";
import { I18nProvider } from "./i18n";
import "./index.css";
import "./styles/brand.css";
import "./styles/lang-switch.css";

const isAdminRoute =
  window.location.pathname === "/admin" ||
  window.location.pathname.startsWith("/admin/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>{isAdminRoute ? <AdminApp /> : <App />}</I18nProvider>
  </React.StrictMode>
);
