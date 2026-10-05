import { PaperPlaneRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { replyTaskInTelegram, Task } from "../api";
import { useI18n } from "../i18n";

interface Props {
  task: Task;
}

export function TaskTelegramReply({ task }: Props) {
  const { messages } = useI18n();
  const r = messages.panel.task.reply;
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
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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
      setError(e instanceof Error ? e.message : r.error);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="te-reply">
      <span className="te-field__label">{r.title}</span>
      <div className="te-reply__box">
        <textarea
          ref={inputRef}
          className="te-reply__input"
          value={draft}
          rows={2}
          onChange={(e) => {
            setDraft(e.target.value);
            if (sentLink) setSentLink(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) void send();
            }
          }}
          placeholder={r.placeholder}
          aria-label={r.title}
        />
        <button
          type="button"
          className="te-btn te-btn--primary te-btn--sm te-reply__send"
          onClick={send}
          disabled={!canSend}
        >
          {r.send}
          <PaperPlaneRight size={15} weight="fill" aria-hidden />
        </button>
      </div>
      {sentLink ? (
        <p className="te-reply__hint te-reply__hint--ok" role="status">
          {r.sent}{" "}
          <a href={sentLink} target="_blank" rel="noreferrer">
            {r.openSent}
          </a>
        </p>
      ) : (
        <p className="te-reply__hint">{r.hint}</p>
      )}
      {error && <p className="te-alert te-alert--error">{error}</p>}
    </section>
  );
}
