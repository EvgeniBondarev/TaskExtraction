const API = import.meta.env.VITE_API_URL || "";

export const MY_TELEGRAM_APPS_URL = "https://my.telegram.org/apps";

export interface TelegramStatus {
  has_credentials: boolean;
  is_authorized: boolean;
  setup_complete: boolean;
  setup_step: "credentials" | "auth" | "complete";
  api_id: number | null;
  username: string | null;
  user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  monitor_chat_id: number | null;
  app_title: string | null;
  qr_pending: boolean;
  my_telegram_apps_url: string;
}

export async function fetchTelegramStatus(): Promise<TelegramStatus> {
  const r = await fetch(`${API}/api/telegram/status`);
  if (!r.ok) throw new Error("Failed to load status");
  return r.json();
}

export async function saveTelegramCredentials(body: {
  api_id: number;
  api_hash: string;
  monitor_chat_id?: number;
  app_title?: string;
  app_short_name?: string;
}) {
  const r = await fetch(`${API}/api/telegram/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    const detail = (err as { detail?: string | string[] }).detail;
    const msg = Array.isArray(detail) ? detail.join(", ") : detail;
    throw new Error(msg || `Ошибка сохранения (${r.status})`);
  }
  return r.json();
}

export async function startQrLogin() {
  const r = await fetch(`${API}/api/telegram/auth/qr/start`, { method: "POST" });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "QR start failed");
  }
  return r.json() as Promise<{
    login_id: string;
    url: string | null;
    already_authorized: boolean;
    username?: string;
    expires_in?: number;
  }>;
}

export async function refreshQrLogin(loginId: string) {
  const r = await fetch(`${API}/api/telegram/auth/qr/refresh/${loginId}`, {
    method: "POST",
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "QR refresh failed");
  }
  return r.json() as Promise<{
    login_id: string;
    url: string | null;
    expires_in?: number;
  }>;
}

export async function getQrStatus(loginId: string) {
  const r = await fetch(`${API}/api/telegram/auth/qr/status/${loginId}`);
  if (!r.ok) throw new Error("Status check failed");
  return r.json() as Promise<{
    status: string;
    message?: string;
    username?: string;
    user_id?: number;
    first_name?: string;
    last_name?: string;
  }>;
}

export function pollQrStatus(
  loginId: string,
  onUpdate: (s: { status: string; message?: string }) => void | Promise<void>
) {
  const id = setInterval(async () => {
    try {
      const s = await getQrStatus(loginId);
      await onUpdate(s);
      if (
        s.status === "authorized" ||
        s.status === "expired" ||
        s.status === "token_expired"
      ) {
        clearInterval(id);
      }
    } catch {
      /* retry */
    }
  }, 2000);
  return () => clearInterval(id);
}

export async function sendPhoneCode(phone: string) {
  const r = await fetch(`${API}/api/telegram/auth/phone/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Send code failed");
  }
  return r.json() as Promise<{
    login_id: string;
    code_sent: boolean;
    phone_masked?: string;
    message?: string;
    already_authorized?: boolean;
  }>;
}

export async function verifyPhoneCode(
  loginId: string,
  code: string,
  password?: string
) {
  const r = await fetch(`${API}/api/telegram/auth/phone/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login_id: loginId, code, password: password || undefined }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Verify failed");
  }
  return r.json() as Promise<{
    status: string;
    message?: string;
    username?: string;
  }>;
}

export async function fetchTelegramCredentials() {
  const r = await fetch(`${API}/api/telegram/credentials`);
  if (r.status === 404 || r.status === 204) return null;
  if (!r.ok) throw new Error("Failed to load credentials");
  const text = await r.text();
  if (!text) return null;
  return JSON.parse(text) as {
    api_id: number;
    api_hash_masked: string;
    monitor_chat_id: number | null;
    app_title: string | null;
  };
}

export async function logoutTelegram() {
  const r = await fetch(`${API}/api/telegram/auth/logout`, { method: "POST" });
  if (!r.ok) throw new Error("Logout failed");
  return r.json() as Promise<{ ok: boolean; message?: string }>;
}

export async function resetTelegramAll() {
  const r = await fetch(`${API}/api/telegram/reset`, { method: "POST" });
  if (!r.ok) throw new Error("Reset failed");
  return r.json();
}
