import { useEffect, useRef, useState } from "react";
import { Task, replyTaskInTelegram } from "../api";

interface Props {
  task: Task;
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21.5 3.5L2.8 10.8c-.9.35-.88 1.62.04 1.93l4.55 1.4 1.75 5.3c.28.85 1.42 1.02 1.95.3l2.55-3.35 5.2 3.85c.72.53 1.74.12 1.92-.75L22.4 5.1c.2-.98-.72-1.78-1.9-1.6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TaskTelegramReply({ task }: Props) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentLink, setSentLink] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft("");
    setError("");
    setSentLink(null);
  }, [task.id]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  }, [draft]);

  if (!task.telegram_link) return null;

  const canSend = draft.trim().length > 0 && !sending;

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setError("");
    try {
      const res = await replyTaskInTelegram(task.id, text, window.location.origin);
      setSentLink(res.telegram_link);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) void send();
    }
  };

  return (
    <section className="tg-compose">
      {sentLink ? (
        <div className="tg-compose-bar tg-compose-bar--done">
          <span className="tg-compose-done-text">
            Отправлено ·{" "}
            <a href={sentLink} target="_blank" rel="noreferrer">
              открыть в Telegram
            </a>
          </span>
        </div>
      ) : (
        <div className="tg-compose-bar">
          <textarea
            ref={inputRef}
            className="tg-compose-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Сообщение"
            aria-label="Ответ в Telegram"
          />
          <button
            type="button"
            className="tg-compose-send"
            onClick={send}
            disabled={!canSend}
            aria-label="Отправить"
            title="Отправить"
          >
            <SendIcon />
          </button>
        </div>
      )}

      <p className="tg-compose-caption">
        Ответ в чат
        {task.telegram_link && (
          <>
            {" · "}
            <a href={task.telegram_link} target="_blank" rel="noreferrer">
              к исходному
            </a>
          </>
        )}
        {" · ссылка на карточку добавится автоматически"}
      </p>

      {error && <p className="tg-compose-error">{error}</p>}

      <style>{`
        .tg-compose {
          margin: 0;
          padding: 0.65rem 0 0;
        }
        .tg-compose-bar {
          display: flex;
          align-items: flex-end;
          gap: 0.35rem;
          padding: 0.35rem 0.4rem 0.35rem 0.85rem;
          border-radius: 1.25rem;
          background: #2b3344;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .tg-compose-bar--done {
          align-items: center;
          justify-content: center;
          min-height: 2.5rem;
          padding: 0.55rem 0.85rem;
        }
        .tg-compose-input {
          flex: 1;
          min-width: 0;
          margin: 0;
          padding: 0.4rem 0;
          border: none;
          background: transparent;
          color: #f1f5f9;
          font: inherit;
          font-size: 0.9rem;
          line-height: 1.35;
          resize: none;
          max-height: 5.5rem;
          field-sizing: content;
        }
        .tg-compose-input::placeholder {
          color: #6b7c93;
        }
        .tg-compose-input:focus {
          outline: none;
        }
        .tg-compose-send {
          flex-shrink: 0;
          width: 2.25rem;
          height: 2.25rem;
          margin: 0;
          padding: 0;
          border: none;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          background: #3390ec;
          transition: background 0.15s, opacity 0.15s, transform 0.1s;
        }
        .tg-compose-send:disabled {
          cursor: default;
          color: #6b7c93;
          background: #3d4a5c;
          opacity: 0.85;
        }
        .tg-compose-send:not(:disabled):hover {
          background: #4a9eeb;
        }
        .tg-compose-send:not(:disabled):active {
          transform: scale(0.96);
        }
        .tg-compose-caption {
          margin: 0.4rem 0.5rem 0;
          font-size: 0.7rem;
          color: var(--muted);
          line-height: 1.35;
        }
        .tg-compose-caption a {
          color: #7dd3fc;
          text-decoration: none;
        }
        .tg-compose-caption a:hover {
          text-decoration: underline;
        }
        .tg-compose-error {
          margin: 0.35rem 0.5rem 0;
          font-size: 0.75rem;
          color: #f87171;
        }
        .tg-compose-done-text {
          font-size: 0.82rem;
          color: #86efac;
        }
        .tg-compose-done-text a {
          color: #bbf7d0;
          font-weight: 600;
          text-decoration: none;
        }
        .tg-compose-done-text a:hover {
          text-decoration: underline;
        }
      `}</style>
    </section>
  );
}
