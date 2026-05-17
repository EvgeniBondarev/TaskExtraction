const API = import.meta.env.VITE_API_URL || "";
import { apiFetch } from "./http";

export interface ChatItem {
  id: string;
  telegram_chat_id: number;
  title: string | null;
  is_monitored: boolean;
  chat_type: string | null;
  username: string | null;
  parent_telegram_chat_id: number | null;
  has_photo: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ChatsStatus {
  monitored_count: number;
  total_count: number;
  has_monitored: boolean;
}

export async function fetchChatsStatus(): Promise<ChatsStatus> {
  const r = await apiFetch(`${API}/api/chats/status`);
  if (!r.ok) throw new Error("Failed to load chat status");
  return r.json();
}

export async function fetchChats(monitoredOnly = false): Promise<{
  items: ChatItem[];
  total: number;
  monitored_count: number;
}> {
  const q = monitoredOnly ? "?monitored_only=true" : "";
  const r = await apiFetch(`${API}/api/chats${q}`);
  if (!r.ok) throw new Error("Failed to load chats");
  return r.json();
}

export async function syncTelegramChats(): Promise<{ synced: number; items: ChatItem[] }> {
  const r = await apiFetch(`${API}/api/chats/sync`, { method: "POST" });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Sync failed");
  }
  return r.json();
}

export async function saveChatSelection(telegramChatIds: number[]): Promise<void> {
  const r = await apiFetch(`${API}/api/chats/selection`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_chat_ids: telegramChatIds }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Save failed");
  }
}

export function chatAvatarUrl(chatId: string): string {
  return `${API}/api/chats/${chatId}/avatar`;
}

export const CHAT_TYPE_LABELS: Record<string, string> = {
  private: "Личный",
  group: "Группа",
  supergroup: "Супергруппа",
  channel: "Канал",
  unknown: "Чат",
};
