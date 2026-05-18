import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AdminApp } from "./pages/AdminApp";
import "./index.css";
import "./styles/brand.css";

const isAdminRoute =
  window.location.pathname === "/admin" ||
  window.location.pathname.startsWith("/admin/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isAdminRoute ? <AdminApp /> : <App />}</React.StrictMode>
);
