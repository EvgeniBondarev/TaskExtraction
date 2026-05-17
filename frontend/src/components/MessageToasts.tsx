import { useEffect } from "react";
import { createPortal } from "react-dom";
import { WsMessagePayload } from "../api";
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
    <div className="toast-stack" aria-live="polite">
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} onOpen={onOpen} />
      ))}
      <style>{`
        .toast-stack {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: min(380px, calc(100vw - 2rem));
          pointer-events: none;
        }
      `}</style>
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

  const preview = (item.text || "(медиа)").slice(0, 120);
  const title = item.user_display_name || item.chat_title || "Новое сообщение";
  const subtitle = item.chat_title && item.user_display_name ? item.chat_title : null;

  return (
    <div
      className={`toast-card${processing ? " processing" : ""}`}
      role="status"
      aria-label={processing ? `Обработка сообщения от ${title}` : `Новое сообщение от ${title}`}
    >
      <button type="button" className="toast-open" onClick={() => onOpen(item)}>
        <MessageAvatar
          senderUrl={item.sender_avatar_url}
          chatUrl={item.chat_avatar_url}
          name={title}
          size={48}
        />
        <span className="body">
          <span className="title-row">
            <span className="title">{title}</span>
            {processing && <span className="proc-badge">Обработка</span>}
          </span>
          {subtitle && <span className="subtitle">{subtitle}</span>}
          <span className="preview">{preview}</span>
        </span>
      </button>
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(item.id)}
        aria-label="Закрыть уведомление"
        title="Закрыть"
      >
        ×
      </button>
      <style>{`
        .toast-card {
          pointer-events: auto;
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 0.35rem;
          width: 100%;
          padding: 0.65rem 0.5rem 0.65rem 0.65rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
          color: var(--text);
          animation: toast-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .toast-card:hover { border-color: var(--accent); }
        .toast-card.processing { border-color: rgba(96, 165, 250, 0.55); }
        .toast-open {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.1rem 0.15rem;
          margin: 0;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
          color: inherit;
        }
        .toast-close {
          flex-shrink: 0;
          width: 1.75rem;
          height: 1.75rem;
          margin-top: 0.1rem;
          margin-right: 0.15rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--muted);
          font-size: 1.25rem;
          line-height: 1;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .toast-close:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.08);
        }
        .title-row { display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
        .proc-badge {
          flex-shrink: 0;
          font-size: 0.68rem;
          font-weight: 600;
          color: #60a5fa;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          background: rgba(96, 165, 250, 0.15);
          animation: proc-pulse 1.2s ease-in-out infinite;
        }
        @keyframes proc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .toast-card .body {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
          gap: 0.1rem;
        }
        .toast-card .title {
          font-weight: 600;
          font-size: 0.92rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .toast-card .subtitle {
          font-size: 0.78rem;
          color: var(--accent);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .toast-card .preview {
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(1.25rem) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
