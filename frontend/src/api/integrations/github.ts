const API = import.meta.env.VITE_API_URL || "";

export interface GitHubStatus {
  owner: string | null;
  repo: string | null;
  has_token: boolean;
  token_masked: string | null;
  default_labels: string[];
  enabled: boolean;
  auto_push: boolean;
  include_media: boolean;
  include_message_links: boolean;
  use_type_labels: boolean;
  is_configured: boolean;
  repo_url: string | null;
}

export interface GitHubLabel {
  name: string;
  color: string | null;
  description: string | null;
}

export interface GitHubCredentials {
  owner?: string;
  repo?: string;
  token?: string;
}

export interface GitHubTestResult {
  success: boolean;
  message: string;
  account_name?: string | null;
}

async function parseError(r: Response): Promise<string> {
  try {
    const d = await r.json();
    return (d as { detail?: string }).detail || r.statusText;
  } catch {
    return r.statusText;
  }
}

export async function fetchGitHubStatus(): Promise<GitHubStatus> {
  const r = await fetch(`${API}/api/integrations/github/status`);
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function saveGitHubSettings(body: Record<string, unknown>): Promise<GitHubStatus> {
  const r = await fetch(`${API}/api/integrations/github/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function testGitHubConnection(creds?: GitHubCredentials): Promise<GitHubTestResult> {
  const r = await fetch(`${API}/api/integrations/github/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function fetchGitHubLabels(creds?: GitHubCredentials): Promise<GitHubLabel[]> {
  const r = await fetch(`${API}/api/integrations/github/labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}
