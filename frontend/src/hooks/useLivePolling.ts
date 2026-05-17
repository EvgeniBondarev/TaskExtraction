import { useEffect, useRef } from "react";
import { fetchMessages, fetchTasks, Message, Task, WsMessagePayload } from "../api";

const POLL_MS = 4000;

function messageToPayload(msg: Message): WsMessagePayload {
  const status = msg.classification?.status;
  const processing = status === "processing" || status === "pending";

  if (processing) {
    return {
      type: "message_processing",
      processing: true,
      message_id: msg.id,
      text: msg.text,
      user_display_name: msg.user_display_name,
      chat_title: msg.chat_title ?? null,
      chat_avatar_url: msg.chat_avatar_url ?? null,
      sender_avatar_url: msg.sender_avatar_url ?? null,
      created_at: msg.created_at,
      telegram_link: msg.telegram_link,
    };
  }

  if (msg.classification?.task_created) {
    return {
      type: "new_task",
      message_id: msg.id,
      text: msg.text,
      user_display_name: msg.user_display_name,
      chat_title: msg.chat_title ?? null,
      chat_avatar_url: msg.chat_avatar_url ?? null,
      sender_avatar_url: msg.sender_avatar_url ?? null,
      created_at: msg.created_at,
      telegram_link: msg.telegram_link,
    };
  }

  return {
    type: "new_message",
    message_id: msg.id,
    text: msg.text,
    user_display_name: msg.user_display_name,
    chat_title: msg.chat_title ?? null,
    chat_avatar_url: msg.chat_avatar_url ?? null,
    sender_avatar_url: msg.sender_avatar_url ?? null,
    created_at: msg.created_at,
    telegram_link: msg.telegram_link,
  };
}

function taskToPayload(task: Task): WsMessagePayload {
  return {
    type: "new_task",
    message_id: task.source_message_id,
    task,
    text: task.title,
    user_display_name: task.source_user_display_name ?? null,
    chat_title: task.source_chat_title ?? null,
    chat_avatar_url: task.source_chat_avatar_url ?? null,
    sender_avatar_url: task.source_sender_avatar_url ?? null,
    created_at: task.source_created_at ?? task.created_at,
    telegram_link: task.telegram_link,
  };
}

/**
 * Резервный канал live-событий, если WebSocket недоступен (cookie/proxy).
 */
export function useLivePolling(
  enabled: boolean,
  onEvent: (payload: WsMessagePayload) => void,
  seedMessages: Message[],
  seedTasks: Task[],
  seeded: boolean,
  resetKey: number
) {
  const seenMessages = useRef(new Set<string>());
  const seenTasks = useRef(new Set<string>());
  const pollReady = useRef(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    seenMessages.current.clear();
    seenTasks.current.clear();
    pollReady.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!enabled || !seeded || pollReady.current) return;
    seedMessages.forEach((m) => seenMessages.current.add(m.id));
    seedTasks.forEach((t) => seenTasks.current.add(t.id));
    pollReady.current = true;
  }, [enabled, seeded, seedMessages, seedTasks]);

  useEffect(() => {
    if (!enabled || !seeded) return;

    let cancelled = false;

    const tick = async () => {
      if (!pollReady.current) return;
      try {
        const [mRes, tRes] = await Promise.all([fetchMessages(40, 0), fetchTasks()]);
        if (cancelled) return;

        for (const msg of mRes.items) {
          if (seenMessages.current.has(msg.id)) continue;
          seenMessages.current.add(msg.id);
          onEventRef.current(messageToPayload(msg));
        }

        for (const task of tRes.items) {
          if (seenTasks.current.has(task.id)) continue;
          seenTasks.current.add(task.id);
          onEventRef.current(taskToPayload(task));
        }
      } catch {
        /* сеть / 401 */
      }
    };

    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, seeded, resetKey]);
}
