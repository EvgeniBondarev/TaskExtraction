const API = import.meta.env.VITE_API_URL || "";
import { apiFetch } from "../http";

export interface JiraStatus {
  base_url: string | null;
  email: string | null;
  has_token: boolean;
  token_masked: string | null;
  project_key: string | null;
  project_name: string | null;
  issue_type_id: string | null;
  issue_type_name: string | null;
  enabled: boolean;
  auto_push: boolean;
  include_media: boolean;
  include_message_links: boolean;
  is_configured: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  project_type_key: string | null;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description: string | null;
  subtask: boolean;
}

export interface JiraCredentials {
  base_url?: string;
  email?: string;
  api_token?: string;
}

export interface JiraTestResult {
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

export async function fetchJiraStatus(): Promise<JiraStatus> {
  const r = await apiFetch(`${API}/api/integrations/jira/status`);
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function saveJiraSettings(body: Record<string, unknown>): Promise<JiraStatus> {
  const r = await apiFetch(`${API}/api/integrations/jira/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function testJiraConnection(creds?: JiraCredentials): Promise<JiraTestResult> {
  const r = await apiFetch(`${API}/api/integrations/jira/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function fetchJiraProjects(creds?: JiraCredentials): Promise<JiraProject[]> {
  const r = await apiFetch(`${API}/api/integrations/jira/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function fetchJiraIssueTypes(
  projectKey: string,
  creds?: JiraCredentials
): Promise<JiraIssueType[]> {
  const r = await apiFetch(`${API}/api/integrations/jira/projects/${encodeURIComponent(projectKey)}/issuetypes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}
