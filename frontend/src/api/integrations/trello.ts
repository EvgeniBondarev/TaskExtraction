const API = import.meta.env.VITE_API_URL || "";

export interface TrelloStatus {
  api_key: string | null;
  has_token: boolean;
  token_masked: string | null;
  board_id: string | null;
  board_name: string | null;
  list_id: string | null;
  list_name: string | null;
  enabled: boolean;
  auto_push: boolean;
  include_media: boolean;
  include_message_links: boolean;
  is_configured: boolean;
  authorize_url: string | null;
}

export interface TrelloBoard {
  id: string;
  name: string;
  url: string | null;
  closed: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
}

export interface TrelloCredentials {
  api_key?: string;
  token?: string;
}

export interface TrelloTestResult {
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

export async function fetchTrelloStatus(): Promise<TrelloStatus> {
  const r = await fetch(`${API}/api/integrations/trello/status`);
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function saveTrelloSettings(body: Record<string, unknown>): Promise<TrelloStatus> {
  const r = await fetch(`${API}/api/integrations/trello/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function testTrelloConnection(creds?: TrelloCredentials): Promise<TrelloTestResult> {
  const r = await fetch(`${API}/api/integrations/trello/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function fetchTrelloBoards(creds?: TrelloCredentials): Promise<TrelloBoard[]> {
  const r = await fetch(`${API}/api/integrations/trello/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}

export async function fetchTrelloLists(
  boardId: string,
  creds?: TrelloCredentials
): Promise<TrelloList[]> {
  const r = await fetch(`${API}/api/integrations/trello/boards/${encodeURIComponent(boardId)}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds || {}),
  });
  if (!r.ok) throw new Error(await parseError(r));
  return r.json();
}
