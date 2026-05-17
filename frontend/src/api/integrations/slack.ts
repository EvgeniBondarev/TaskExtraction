const API = import.meta.env.VITE_API_URL || "";
import { apiFetch } from "../http";

export interface SlackStatus {
  has_token: boolean;
  token_masked: string | null;
  channel_id: string | null;
  channel_name: string | null;
  workspace_name: string | null;
  workspace_url: string | null;
  enabled: boolean;
  auto_push: boolean;
  include_media: boolean;
  include_message_links: boolean;
  mention_channel: boolean;
  is_configured: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  num_members: number | null;
}

export interface SlackCredentials {
  bot_token?: string;
}

export interface SlackTestResult {
  success: boolean;
  message: string;
  workspace_name?: string | null;
  workspace_url?: string | null;
  bot_name?: string | null;
}

async function parseError(r: Response): Promise<string> {
  try {
    const d = await r.json();
    return (d as { detail?: string }).detail || r.statusText;
  } catch {
    return r.statusText;
  }
}

export async function fetchSlackStatus(): Promise<SlackStatus> {
  const r = await apiFetch(`${API}/api/integrations/slack/status`);
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function saveSlackSettings(body: Record<string, unknown>): Promise<SlackStatus> {
  const r = await apiFetch(`${API}/api/integrations/slack/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function testSlackConnection(creds?: SlackCredentials): Promise<SlackTestResult> {
  const r = await apiFetch(`${API}/api/integrations/slack/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function fetchSlackChannels(creds?: SlackCredentials): Promise<SlackChannel[]> {
  const r = await apiFetch(`${API}/api/integrations/slack/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}
