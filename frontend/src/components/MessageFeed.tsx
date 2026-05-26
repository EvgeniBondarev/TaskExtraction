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
import "../styles/feed-page.css";

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
  onTaskCreated,
}: {
  messages: Message[];
  tasks?: Task[];
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
    <div className="feed-page">
      <header className="feed-page__header">
        <div className="feed-page__title">
          <span className="feed-page__title-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2>Лента сообщений</h2>
            <p>Live-поток из отслеживаемых чатов Telegram</p>
          </div>
        </div>

        <div className="feed-page__stats" aria-label="Статистика ленты">
          <span className="feed-page__stat">
            <span className="feed-page__stat-num">{messages.length}</span>
            <span className="feed-page__stat-label">сообщений</span>
          </span>
          <span
            className={`feed-page__stat feed-page__stat--accent${
              taskCandidates === 0 ? " feed-page__stat--muted" : ""
            }`}
          >
            <span className="feed-page__stat-num">{taskCandidates}</span>
            <span className="feed-page__stat-label">можно в задачи</span>
          </span>
        </div>
      </header>

      <div className="feed-page__toolbar">
        <div className="feed-page__search">
          <span className="feed-page__search-icon" aria-hidden>
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
              className="feed-page__search-clear"
              onClick={() => setFilter("")}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </div>
        <p className={`feed-page__search-meta${filter ? " is-visible" : ""}`} aria-live="polite">
          {filter ? `Показано ${displayed.length} из ${messages.length}` : "\u00a0"}
        </p>
      </div>

      <div className="feed-page__list">
        {displayed.length === 0 ? (
          <div className="feed-page__empty" role="status">
            <div className="feed-page__empty-icon" aria-hidden />
            <strong>{messages.length === 0 ? "Пока нет сообщений" : "Ничего не найдено"}</strong>
            <p>
              {messages.length === 0
                ? "Как только в выбранных чатах появятся новые сообщения, они отобразятся здесь."
                : `Нет совпадений по «${filter}»`}
            </p>
          </div>
        ) : (
          displayed.map((m, index) => {
            const jiraLink = getMessageJiraLink(m, jiraByMessage);
            const trelloLink = getMessageTrelloLink(m, trelloByMessage);
            const githubLink = getMessageGitHubLink(m, githubByMessage);
            const slackLink = getMessageSlackLink(m, slackByMessage);
            const showCreate = canCreateTask(m.classification);
            const isFirst = index === 0;
            const hasIntegrations = Boolean(jiraLink || trelloLink || githubLink || slackLink);

            return (
              <article
                key={m.id}
                className={`feed-msg${showCreate ? " feed-msg--actionable" : ""}${
                  isFirst ? " feed-msg--latest" : ""
                }`}
              >
                <div className="feed-msg__top">
                  <div className="feed-msg__avatar">
                    <MessageAvatar
                      senderUrl={m.sender_avatar_url}
                      chatUrl={m.chat_avatar_url}
                      name={m.user_display_name || m.chat_title}
                      size={48}
                    />
                  </div>
                  <div className="feed-msg__head">
                    <div className="feed-msg__author-row">
                      <strong>{m.user_display_name || "User"}</strong>
                      {isFirst && !filter && <span className="feed-msg__new-pill">новое</span>}
                    </div>
                    {m.chat_title && <span className="feed-msg__chat">{m.chat_title}</span>}
                    <time className="feed-msg__time" dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString("ru", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <div className="feed-msg__badge-col">
                    <MessageClassificationBadge classification={m.classification} />
                  </div>
                </div>

                {(m.text || (!m.attachments?.length && !m.text)) && (
                  <div className="feed-msg__body">
                    {m.text ? (
                      <p className="feed-msg__text">{m.text}</p>
                    ) : (
                      <p className="feed-msg__text feed-msg__text--placeholder">Медиа без текста</p>
                    )}
                  </div>
                )}

                {m.attachments && m.attachments.length > 0 && (
                  <div className="feed-msg__attachments">
                    <AttachmentList attachments={m.attachments} compact />
                  </div>
                )}

                <footer className="feed-msg__footer">
                  <div className="feed-msg__integrations">
                    {hasIntegrations && (
                      <>
                        {jiraLink && <JiraLinkIcon link={jiraLink} />}
                        {trelloLink && <TrelloLinkIcon link={trelloLink} />}
                        {githubLink && <GitHubLinkIcon link={githubLink} />}
                        {slackLink && <SlackLinkIcon link={slackLink} />}
                      </>
                    )}
                  </div>
                  <div className="feed-msg__actions">
                    {m.telegram_link && (
                      <a
                        className="feed-msg__btn-outline"
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
                        className="feed-msg__btn-primary"
                        disabled={busyId === m.id}
                        onClick={() => handleCreate(m.id)}
                      >
                        {busyId === m.id ? "Создаём…" : "Создать задачу"}
                      </button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
