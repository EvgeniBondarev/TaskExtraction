import { useMemo, useState } from "react";
import { Message, reprocessMessage, Task } from "../api";
import { MessageAvatar } from "./MessageAvatar";
import { AttachmentList } from "./AttachmentList";
import { MessageClassificationBadge } from "./MessageClassificationBadge";
import { JiraLinkIcon } from "./JiraLinkIcon";
import { GitHubLinkIcon } from "./GitHubLinkIcon";
import { SlackLinkIcon } from "./SlackLinkIcon";
import { TrelloLinkIcon } from "./TrelloLinkIcon";
import { getMessageGitHubLink, githubLinksByMessageId } from "../utils/githubIntegration";
import { getMessageJiraLink, jiraLinksByMessageId } from "../utils/jiraIntegration";
import { getMessageSlackLink, slackLinksByMessageId } from "../utils/slackIntegration";
import { getMessageTrelloLink, trelloLinksByMessageId } from "../utils/trelloIntegration";

function canCreateTask(c: Message["classification"]): boolean {
  if (!c?.is_task || c.task_created) return false;
  if (c.ai_confidence != null && c.threshold != null) {
    return c.ai_confidence >= c.threshold;
  }
  return true;
}

export function MessageFeed({
  messages,
  tasks = [],
  jiraActive = false,
  trelloActive = false,
  githubActive = false,
  slackActive = false,
  onTaskCreated,
}: {
  messages: Message[];
  tasks?: Task[];
  jiraActive?: boolean;
  trelloActive?: boolean;
  githubActive?: boolean;
  slackActive?: boolean;
  onTaskCreated?: (task: Task) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const jiraByMessage = useMemo(() => jiraLinksByMessageId(tasks), [tasks]);
  const trelloByMessage = useMemo(() => trelloLinksByMessageId(tasks), [tasks]);
  const githubByMessage = useMemo(() => githubLinksByMessageId(tasks), [tasks]);
  const slackByMessage = useMemo(() => slackLinksByMessageId(tasks), [tasks]);

  const q = filter.trim().toLowerCase();
  const displayed = useMemo(() => {
    if (!q) return messages;
    return messages.filter(
      (m) =>
        (m.text || "").toLowerCase().includes(q) ||
        (m.user_display_name || "").toLowerCase().includes(q) ||
        (m.chat_title || "").toLowerCase().includes(q)
    );
  }, [messages, q]);

  const taskCandidates = useMemo(
    () => displayed.filter((m) => canCreateTask(m.classification)).length,
    [displayed]
  );

  const handleCreate = async (messageId: string) => {
    setBusyId(messageId);
    try {
      const task = await reprocessMessage(messageId);
      if (task) onTaskCreated?.(task);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="feed-shell">
      <div className="feed-column">
        <header className="feed-hero">
          <div className="hero-glow" aria-hidden />
          <div className="hero-inner">
            <div className="hero-icon" aria-hidden>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="hero-text">
              <h2>Лента сообщений</h2>
              <p>Live-поток из отслеживаемых чатов Telegram</p>
            </div>
          </div>
          <div className="hero-stats">
            <span className="hero-stat">
              <span className="stat-num">{messages.length}</span>
              <span className="stat-label">сообщений</span>
            </span>
            {taskCandidates > 0 && (
              <span className="hero-stat accent">
                <span className="stat-num">{taskCandidates}</span>
                <span className="stat-label">можно в задачи</span>
              </span>
            )}
          </div>
        </header>

        <div className="feed-toolbar">
          <div className="feed-search">
            <span className="search-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Поиск по тексту, автору, чату…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Поиск в ленте"
            />
            {filter && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setFilter("")}
                aria-label="Очистить поиск"
              >
                ×
              </button>
            )}
          </div>
          {filter && (
            <p className="search-meta">
              Показано {displayed.length} из {messages.length}
            </p>
          )}
        </div>

        <div className="feed-timeline">
          {displayed.length === 0 ? (
            <div className="feed-empty" role="status">
              <div className="empty-ring" aria-hidden />
              <strong>{messages.length === 0 ? "Пока нет сообщений" : "Ничего не найдено"}</strong>
              <p>
                {messages.length === 0
                  ? "Как только в выбранных чатах появятся новые сообщения, они отобразятся здесь."
                  : `Нет совпадений по «${filter}»`}
              </p>
            </div>
          ) : (
            displayed.map((m, index) => {
              const jiraLinkRaw = getMessageJiraLink(m, jiraByMessage);
              const trelloLinkRaw = getMessageTrelloLink(m, trelloByMessage);
              const githubLinkRaw = getMessageGitHubLink(m, githubByMessage);
              const slackLinkRaw = getMessageSlackLink(m, slackByMessage);
              const jiraLink = jiraActive && jiraLinkRaw ? jiraLinkRaw : null;
              const trelloLink = trelloActive && trelloLinkRaw ? trelloLinkRaw : null;
              const githubLink = githubActive && githubLinkRaw ? githubLinkRaw : null;
              const slackLink = slackActive && slackLinkRaw ? slackLinkRaw : null;
              const showCreate = canCreateTask(m.classification);
              const isFirst = index === 0;

              return (
                <article
                  key={m.id}
                  className={`msg-card${showCreate ? " actionable" : ""}${isFirst ? " latest" : ""}`}
                >
                  <span className="timeline-dot" aria-hidden />
                  <div className="msg-card-inner">
                    <div className="msg-top">
                      <MessageAvatar
                        senderUrl={m.sender_avatar_url}
                        chatUrl={m.chat_avatar_url}
                        name={m.user_display_name || m.chat_title}
                        size={48}
                      />
                      <div className="msg-head">
                        <div className="msg-author-row">
                          <strong>{m.user_display_name || "User"}</strong>
                          {isFirst && !filter && <span className="new-pill">новое</span>}
                        </div>
                        {m.chat_title && <span className="chat-pill">{m.chat_title}</span>}
                        <time dateTime={m.created_at}>
                          {new Date(m.created_at).toLocaleString("ru", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <div className="msg-badges">
                        <MessageClassificationBadge classification={m.classification} />
                      </div>
                    </div>

                    {(m.text || (!m.attachments?.length && !m.text)) && (
                      <div className="msg-body">
                        {m.text ? (
                          <p className="msg-text">{m.text}</p>
                        ) : (
                          <p className="msg-text placeholder">Медиа без текста</p>
                        )}
                      </div>
                    )}

                    {m.attachments && m.attachments.length > 0 && (
                      <div className="msg-attachments">
                        <AttachmentList attachments={m.attachments} compact />
                      </div>
                    )}

                    <footer className="msg-actions">
                      <div className="integration-links">
                        {jiraLink && <JiraLinkIcon link={jiraLink} />}
                        {trelloLink && <TrelloLinkIcon link={trelloLink} />}
                        {githubLink && <GitHubLinkIcon link={githubLink} />}
                        {slackLink && <SlackLinkIcon link={slackLink} />}
                      </div>
                      <div className="action-btns">
                        {m.telegram_link && (
                          <a
                            className="btn-outline"
                            href={m.telegram_link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Telegram
                          </a>
                        )}
                        {showCreate && (
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={busyId === m.id}
                            onClick={() => handleCreate(m.id)}
                          >
                            {busyId === m.id ? "Создаём…" : "Создать задачу"}
                          </button>
                        )}
                      </div>
                    </footer>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .feed-shell {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 0 1rem 2.5rem;
          box-sizing: border-box;
        }
        .feed-column {
          width: 100%;
          max-width: 880px;
          margin: 0 auto;
        }

        .feed-hero {
          position: relative;
          margin-bottom: 1.25rem;
          padding: 1.25rem 1.35rem 1.15rem;
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.25);
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 20, 25, 0.6) 100%);
          overflow: hidden;
        }
        .hero-glow {
          position: absolute;
          top: -40%;
          right: -20%;
          width: 55%;
          height: 120%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-inner {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 1rem;
        }
        .hero-icon {
          flex-shrink: 0;
          width: 2.75rem;
          height: 2.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #93c5fd;
        }
        .hero-text h2 {
          margin: 0 0 0.2rem;
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: -0.03em;
        }
        .hero-text p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--muted);
        }
        .hero-stats {
          position: relative;
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .hero-stat {
          display: flex;
          flex-direction: column;
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border);
          min-width: 5.5rem;
        }
        .hero-stat.accent {
          border-color: rgba(59, 130, 246, 0.45);
          background: rgba(59, 130, 246, 0.1);
        }
        .stat-num {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.1;
          color: var(--text);
        }
        .hero-stat.accent .stat-num { color: #93c5fd; }
        .stat-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-top: 0.15rem;
        }

        .feed-toolbar {
          position: sticky;
          top: 0.5rem;
          z-index: 10;
          margin-bottom: 1.25rem;
        }
        .feed-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.55rem 0.4rem 0.8rem;
          background: rgba(26, 35, 50, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .feed-search:focus-within {
          border-color: var(--accent);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .search-icon { color: var(--muted); display: flex; flex-shrink: 0; }
        .feed-search input {
          flex: 1;
          min-width: 0;
          border: none;
          background: transparent;
          color: var(--text);
          padding: 0.5rem 0;
          font: inherit;
          font-size: 0.9rem;
        }
        .feed-search input:focus { outline: none; }
        .feed-search input::placeholder { color: var(--muted); }
        .search-clear {
          flex-shrink: 0;
          width: 1.85rem;
          height: 1.85rem;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--muted);
          font-size: 1.15rem;
          line-height: 1;
          cursor: pointer;
        }
        .search-clear:hover { color: var(--text); background: rgba(255, 255, 255, 0.1); }
        .search-meta {
          margin: 0.4rem 0 0 0.15rem;
          font-size: 0.75rem;
          color: var(--muted);
        }

        .feed-timeline {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding-left: 0.35rem;
        }
        .feed-timeline::before {
          content: "";
          position: absolute;
          left: 0.55rem;
          top: 0.5rem;
          bottom: 0.5rem;
          width: 2px;
          background: linear-gradient(180deg, var(--accent) 0%, var(--border) 40%, transparent 100%);
          border-radius: 2px;
          opacity: 0.5;
        }

        .feed-empty {
          text-align: center;
          padding: 3.5rem 1.5rem;
          margin-left: 1rem;
          border-radius: 16px;
          border: 1px dashed rgba(59, 130, 246, 0.3);
          background: var(--surface);
        }
        .empty-ring {
          width: 3.5rem;
          height: 3.5rem;
          margin: 0 auto 1rem;
          border-radius: 50%;
          border: 2px dashed var(--border);
          background: rgba(59, 130, 246, 0.06);
        }
        .feed-empty strong {
          display: block;
          font-size: 1.05rem;
          margin-bottom: 0.4rem;
        }
        .feed-empty p {
          margin: 0 auto;
          max-width: 280px;
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.5;
        }

        .msg-card {
          position: relative;
          margin-left: 1.15rem;
          padding-left: 0.5rem;
        }
        .timeline-dot {
          position: absolute;
          left: -1.05rem;
          top: 1.35rem;
          width: 0.65rem;
          height: 0.65rem;
          border-radius: 50%;
          background: var(--border);
          border: 2px solid var(--bg);
          box-shadow: 0 0 0 2px var(--border);
          z-index: 1;
        }
        .msg-card.latest .timeline-dot {
          background: var(--accent);
          box-shadow: 0 0 0 2px var(--bg), 0 0 10px rgba(59, 130, 246, 0.6);
        }
        .msg-card.actionable .timeline-dot {
          background: #4ade80;
          box-shadow: 0 0 0 2px var(--bg), 0 0 8px rgba(74, 222, 128, 0.5);
        }

        .msg-card-inner {
          background: linear-gradient(160deg, rgba(30, 41, 59, 0.85) 0%, rgba(26, 35, 50, 0.95) 100%);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1rem 1.1rem 0.9rem;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .msg-card:hover .msg-card-inner {
          border-color: rgba(59, 130, 246, 0.35);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
          transform: translateY(-1px);
        }
        .msg-card.latest .msg-card-inner {
          border-color: rgba(59, 130, 246, 0.4);
        }
        .msg-card.actionable .msg-card-inner {
          border-color: rgba(74, 222, 128, 0.25);
          background: linear-gradient(160deg, rgba(30, 41, 59, 0.9) 0%, rgba(20, 35, 30, 0.4) 100%);
        }

        .msg-top {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 0.75rem;
          align-items: start;
          margin-bottom: 0.65rem;
        }
        .msg-head { min-width: 0; }
        .msg-author-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .msg-author-row strong {
          font-size: 0.95rem;
          font-weight: 600;
        }
        .new-pill {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.12rem 0.4rem;
          border-radius: 4px;
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
        }
        .chat-pill {
          display: inline-block;
          margin-top: 0.15rem;
          font-size: 0.78rem;
          color: #60a5fa;
          font-weight: 500;
        }
        .msg-head time {
          display: block;
          margin-top: 0.2rem;
          font-size: 0.72rem;
          color: var(--muted);
        }
        .msg-badges {
          display: flex;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        .msg-body { margin-bottom: 0.5rem; }
        .msg-text {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
          color: #e2e8f0;
        }
        .msg-text.placeholder {
          color: var(--muted);
          font-style: italic;
          font-size: 0.85rem;
        }
        .msg-attachments { margin-bottom: 0.5rem; }

        .msg-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding-top: 0.65rem;
          margin-top: 0.25rem;
          border-top: 1px solid rgba(45, 58, 79, 0.6);
        }
        .integration-links {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .action-btns {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-left: auto;
          flex-wrap: wrap;
        }
        .btn-outline {
          font-size: 0.78rem;
          font-weight: 500;
          padding: 0.38rem 0.7rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.15s, border-color 0.15s;
        }
        .btn-outline:hover {
          color: #93c5fd;
          border-color: rgba(59, 130, 246, 0.5);
        }
        .btn-primary {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.42rem 0.9rem;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          cursor: pointer;
          font: inherit;
          box-shadow: 0 2px 12px rgba(37, 99, 235, 0.35);
          transition: transform 0.1s, box-shadow 0.15s;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: wait;
          transform: none;
        }

        @media (max-width: 520px) {
          .feed-shell { padding: 0 0.65rem 2rem; }
          .msg-top {
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
          }
          .msg-badges {
            grid-column: 1 / -1;
            justify-content: flex-start;
          }
          .msg-actions { flex-direction: column; align-items: stretch; }
          .action-btns { margin-left: 0; width: 100%; }
          .btn-primary, .btn-outline { flex: 1; text-align: center; }
        }
      `}</style>
    </div>
  );
}
