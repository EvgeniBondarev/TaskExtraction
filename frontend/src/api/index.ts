const API = import.meta.env.VITE_API_URL || "";

export interface Attachment {
  id: string;
  message_id: string;
  kind: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  url: string | null;
  download_url: string | null;
  is_image: boolean;
  is_video: boolean;
  is_audio: boolean;
  label: string;
}

export interface MessageClassification {
  status: string;
  is_task: boolean | null;
  confidence: number | null;
  ai_confidence: number | null;
  heuristic_score: number | null;
  threshold: number | null;
  reason: string | null;
  prefilter_reason: string | null;
  skip_reason?: string | null;
  task_created: boolean;
}

export interface Message {
  id: string;
  telegram_message_id: number;
  user_display_name: string | null;
  text: string | null;
  created_at: string;
  telegram_link: string | null;
  chat_title?: string | null;
  chat_avatar_url?: string | null;
  sender_avatar_url?: string | null;
  classification?: MessageClassification | null;
  attachments?: Attachment[];
  jira_issue_key?: string | null;
  jira_url?: string | null;
  trello_card_id?: string | null;
  trello_url?: string | null;
  github_issue_number?: string | null;
  github_url?: string | null;
  slack_message_id?: string | null;
  slack_url?: string | null;
}

export interface WsMessagePayload {
  type: string;
  processing?: boolean;
  message_id?: string;
  task_id?: string | null;
  task?: Task | null;
  chat_title?: string | null;
  chat_id?: string;
  user_display_name?: string | null;
  text?: string | null;
  created_at?: string | null;
  chat_avatar_url?: string | null;
  sender_avatar_url?: string | null;
  telegram_link?: string | null;
}

export interface ExternalLink {
  id: string;
  provider: string;
  external_id: string;
  url: string;
}

export interface Task {
  id: string;
  source_message_id?: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  assignee: string | null;
  confidence: number | null;
  telegram_link: string | null;
  external_links: ExternalLink[];
  attachments?: Attachment[];
  created_at: string;
  updated_at?: string;
  source_user_display_name?: string | null;
  source_sender_avatar_url?: string | null;
  source_chat_title?: string | null;
  source_chat_avatar_url?: string | null;
  source_chat_type?: string | null;
  source_is_group?: boolean;
  source_created_at?: string | null;
}

export async function fetchMessages(limit = 50, offset = 0) {
  const r = await fetch(`${API}/api/messages?limit=${limit}&offset=${offset}`);
  if (!r.ok) throw new Error("Failed to load messages");
  return r.json() as Promise<{ items: Message[]; total: number }>;
}

export async function fetchTasks(status?: string) {
  const q = status ? `?status=${status}` : "";
  const r = await fetch(`${API}/api/tasks${q}`);
  if (!r.ok) throw new Error("Failed to load tasks");
  return r.json() as Promise<{ items: Task[] }>;
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const r = await fetch(`${API}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error("Update failed");
  return r.json() as Promise<Task>;
}

export async function reprocessMessage(messageId: string): Promise<Task | null> {
  const r = await fetch(`${API}/api/tasks/reprocess/${messageId}`, { method: "POST" });
  if (!r.ok) throw new Error("Не удалось создать задачу");
  const data = await r.json();
  return data as Task | null;
}

export async function dismissTask(id: string) {
  const r = await fetch(`${API}/api/tasks/${id}/dismiss`, { method: "POST" });
  if (!r.ok) throw new Error("Dismiss failed");
  return r.json() as Promise<Task>;
}

export async function pushTask(id: string, provider: string) {
  const r = await fetch(`${API}/api/tasks/${id}/push/${provider}`, { method: "POST" });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Push failed");
  }
  return r.json() as Promise<ExternalLink>;
}

export function connectMessagesWs(onEvent: (payload: WsMessagePayload) => void) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const host = import.meta.env.VITE_WS_HOST || location.host;
  let ws: WebSocket | null = null;
  let closed = false;
  let retryMs = 1000;

  const connect = () => {
    if (closed) return;
    ws = new WebSocket(`${proto}//${host}/ws/messages`);
    ws.onopen = () => {
      retryMs = 1000;
    };
    ws.onmessage = (ev) => {
      try {
        onEvent(JSON.parse(ev.data) as WsMessagePayload);
      } catch {
        onEvent({ type: "refresh" });
      }
    };
    ws.onclose = () => {
      if (closed) return;
      setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, 15000);
    };
    ws.onerror = () => ws?.close();
  };

  connect();
  return () => {
    closed = true;
    ws?.close();
  };
}

export function wsPayloadToMessage(payload: WsMessagePayload): Message | null {
  if (!payload.message_id) return null;
  return {
    id: payload.message_id,
    telegram_message_id: 0,
    user_display_name: payload.user_display_name ?? null,
    text: payload.text ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
    telegram_link: payload.telegram_link ?? null,
    chat_title: payload.chat_title ?? null,
    chat_avatar_url: payload.chat_avatar_url ?? null,
    sender_avatar_url: payload.sender_avatar_url ?? null,
    classification: payload.processing
      ? {
          status: "processing",
          is_task: null,
          confidence: null,
          ai_confidence: null,
          heuristic_score: null,
          threshold: null,
          reason: null,
          prefilter_reason: null,
          task_created: false,
        }
      : undefined,
  };
}
