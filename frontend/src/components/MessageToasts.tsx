import { useEffect } from "react";
import { createPortal } from "react-dom";
import { WsMessagePayload } from "../api";
import { X } from "@phosphor-icons/react";
import { useI18n } from "../i18n";
import { MessageAvatar } from "./MessageAvatar";

export type ToastItem = WsMessagePayload & { id: string; processing?: boolean };

interface Props {
  items: ToastItem[];
  onDismiss: (id: string) => void;
  onOpen: (item: ToastItem) => void;
}

const AUTO_CLOSE_MS = 8000;

export function MessageToasts({ items, onDismiss, onOpen }: Props) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="te-theme te-toasts" aria-live="polite">
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} onOpen={onOpen} />
      ))}
    </div>,
    document.body
  );
}

function ToastCard({
  item,
  onDismiss,
  onOpen,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  onOpen: (item: ToastItem) => void;
}) {
  const processing =
    item.processing || item.type === "message_processing";

  useEffect(() => {
    if (processing) return;
    const t = setTimeout(() => onDismiss(item.id), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [item.id, processing, onDismiss]);

  const { messages } = useI18n();
  const tt = messages.panel.toasts;
  const preview = (item.text || messages.feed.mediaNoText).slice(0, 140);
  const title = item.user_display_name || item.chat_title || tt.newMessage;
  const subtitle = item.chat_title && item.user_display_name ? item.chat_title : null;
  const kind = processing ? tt.processing : item.type === "new_task" ? tt.newTask : tt.newMessage;

  return (
    <div className={`te-toast te-glass${processing ? " is-processing" : ""}`} role="status">
      <button type="button" className="te-toast__open" onClick={() => onOpen(item)} title={tt.open}>
        <MessageAvatar
          senderUrl={item.sender_avatar_url}
          chatUrl={item.chat_avatar_url}
          name={title}
          size={40}
        />
        <span className="te-toast__body">
          <span className={`te-toast__kind${item.type === "new_task" ? " is-task" : ""}`}>{kind}</span>
          <span className="te-toast__title">{title}</span>
          {subtitle && <span className="te-toast__sub">{subtitle}</span>}
          <span className="te-toast__text">{preview}</span>
        </span>
      </button>
      <button
        type="button"
        className="te-icon-btn te-toast__close"
        onClick={() => onDismiss(item.id)}
        aria-label={tt.close}
        title={tt.close}
      >
        <X size={16} />
      </button>
    </div>
  );
}
