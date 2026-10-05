import { apiFetch } from "./http";

const API = import.meta.env.VITE_API_URL || "";

export type GoogleUser = { email: string | null; name: string | null; picture: string | null };
export type GoogleAuthStatus = { configured: boolean; authenticated: boolean; user: GoogleUser | null };

export async function fetchGoogleAuthStatus(): Promise<GoogleAuthStatus> {
  const response = await apiFetch(`${API}/api/auth/google/status`);
  if (!response.ok) throw new Error("Failed to load Google authentication status");
  return response.json();
}

export function startGoogleLogin(): void {
  window.location.assign(`${API}/api/auth/google/start`);
}

export async function logoutGoogle(): Promise<void> {
  const response = await apiFetch(`${API}/api/auth/google/logout`, { method: "POST" });
  if (!response.ok) throw new Error("Failed to log out");
}
