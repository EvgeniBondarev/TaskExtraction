import { ArrowSquareOut, CaretDown, ChatsCircle, MagnifyingGlass, Plus, Sparkle, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Message, reprocessMessage, Task } from "../api";
import { ChatItem, chatAvatarUrl } from "../api/chats";
import { useI18n } from "../i18n";
import { getMessageGitHubLink, githubLinksByMessageId } from "../utils/githubIntegration";
import { getMessageJiraLink, jiraLinksByMessageId } from "../utils/jiraIntegration";
import { getMessageSlackLink, slackLinksByMessageId } from "../utils/slackIntegration";
import { formatShortTime } from "../utils/time";
import { getMessageTrelloLink, trelloLinksByMessageId } from "../utils/trelloIntegration";
import { AttachmentList } from "./AttachmentList";
import { GitHubLinkIcon } from "./GitHubLinkIcon";
import { JiraLinkIcon } from "./JiraLinkIcon";
import { classificationVariant, MessageClassificationBadge } from "./MessageClassificationBadge";
import { MessageAvatar } from "./MessageAvatar";
import { SlackLinkIcon } from "./SlackLinkIcon";
import { TrelloLinkIcon } from "./TrelloLinkIcon";

type FeedFilter = "all" | "tasks" | "candidates" | "other";
const FILTERS: FeedFilter[] = ["all", "tasks", "candidates", "other"];

/** Ручное создание доступно для любого сообщения, которое модель сочла задачей, но карточки ещё нет
 * (бэкенд при ручном создании обходит порог уверенности). */
function canCreateTask(c: Message["classification"]): boolean {
  return Boolean(c?.is_task && !c.task_created);
}

function matches(m: Message, filter: FeedFilter) {
  const v = classificationVariant(m.classification);
  if (filter === "tasks") return v === "created";
  if (filter === "candidates") return v === "candidate";
  if (filter === "other") return v === "not_task" || v === "skip";
  return true;
}

const pct = (n: number | null | undefined) => (n == null ? null : `${Math.round(n * 100)}%`);

export function MessageFeed({
  messages,
  tasks = [],
  chats = [],
  onTaskCreated,
}: {
  messages: Message[];
  tasks?: Task[];
  chats?: ChatItem[];
  onTaskCreated?: (task: Task) => void;
}) {
  const { locale, messages: t } = useI18n();
  const f = t.feed;
  const pf = t.panel.feed;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [chatId, setChatId] = useState<string | null>(null);

  const jiraByMessage = useMemo(() => jiraLinksByMessageId(tasks), [tasks]);
  const trelloByMessage = useMemo(() => trelloLinksByMessageId(tasks), [tasks]);
  const githubByMessage = useMemo(() => githubLinksByMessageId(tasks), [tasks]);
  const slackByMessage = useMemo(() => slackLinksByMessageId(tasks), [tasks]);

  const counts = useMemo(() => {
    const c: Record<FeedFilter, number> = { all: messages.length, tasks: 0, candidates: 0, other: 0 };
    for (const m of messages) {
      for (const k of ["tasks", "candidates", "other"] as const) if (matches(m, k)) c[k] += 1;
    }
    return c;
  }, [messages]);

  const selectedChat = chats.find((c) => c.id === chatId);
  const q = query.trim().toLowerCase();
  const displayed = useMemo(
    () =>
      messages.filter((m) => {
        if (!matches(m, filter)) return false;
        if (selectedChat && (m.chat_id ? m.chat_id !== selectedChat.id : m.chat_title !== selectedChat.title)) return false;
        if (!q) return true;
        return [m.text, m.user_display_name, m.chat_title].some((v) => (v || "").toLowerCase().includes(q));
      }),
    [messages, filter, selectedChat, q],
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

  const filtered = filter !== "all" || q.length > 0 || chatId !== null;

  return (
    <main className="te-page te-feed">
      <header className="te-page__head te-feed__head">
        <div>
          <h1>{f.pageTitle}</h1>
          <p>{f.pageLead}</p>
        </div>
        <div className="te-feed__stats" role="group" aria-label={f.statsAria}>
          <div className="te-feed__stat">
            <span aria-hidden><ChatsCircle size={18} weight="duotone" /></span>
            <strong>{counts.all}</strong>
            <small>{f.statMessages}</small>
          </div>
          <div className="te-feed__stat te-feed__stat--accent">
            <span aria-hidden><Sparkle size={16} weight="fill" /></span>
            <strong>{counts.candidates}</strong>
            <small>{f.statCandidates}</small>
          </div>
        </div>
      </header>

      <div className="te-toolbar">
        <label className="te-search">
          <MagnifyingGlass size={18} aria-hidden />
          <input
            type="search"
            placeholder={f.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={f.searchAria}
          />
          {query && (
            <button type="button" className="te-search__clear" onClick={() => setQuery("")} aria-label={f.searchClear}>
              <X size={14} weight="bold" />
            </button>
          )}
        </label>
        <div className="te-chips" role="group" aria-label={pf.filtersAria}>
          {FILTERS.map((id) => (
            <button
              key={id}
              type="button"
              className={`te-chip${filter === id ? " is-active" : ""}`}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {pf.filters[id]}
              <span className="te-chip__count">{counts[id]}</span>
            </button>
          ))}
        </div>
      </div>

      {chats.length > 0 && (
        <div className="te-feed__chats" role="group" aria-label={f.connectedChats}>
          <span className="te-feed__chats-label">{f.connectedChats}</span>
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              className={`te-chat-chip${chatId === chat.id ? " is-active" : ""}`}
              aria-pressed={chatId === chat.id}
              onClick={() => setChatId((cur) => (cur === chat.id ? null : chat.id))}
            >
              <MessageAvatar chatUrl={chat.has_photo ? chatAvatarUrl(chat.id) : undefined} name={chat.title} size={22} />
              <span>{chat.title || `Chat ${chat.telegram_chat_id}`}</span>
              {chatId === chat.id && <X size={12} weight="bold" aria-hidden />}
            </button>
          ))}
        </div>
      )}

      {filtered && displayed.length > 0 && (
        <p className="te-feed__meta" aria-live="polite">
          {f.searchMeta.replace("{shown}", String(displayed.length)).replace("{total}", String(messages.length))}
        </p>
      )}

      <div className="te-feed__list">
        {displayed.length === 0 ? (
          <div className="te-empty" role="status">
            <ChatsCircle size={32} aria-hidden />
            <strong>{messages.length === 0 ? f.emptyNoMessages : f.emptyNoResults}</strong>
            <p>
              {messages.length === 0
                ? f.emptyNoMessagesHint
                : q
                  ? f.emptyNoResultsHint.replace("{query}", query)
                  : t.panel.board.emptyFiltered}
            </p>
            {filtered && messages.length > 0 && (
              <button
                type="button"
                className="te-btn te-btn--ghost te-btn--sm"
                onClick={() => {
                  setFilter("all");
                  setQuery("");
                  setChatId(null);
                }}
              >
                {t.panel.board.resetFilters}
              </button>
            )}
          </div>
        ) : (
          displayed.map((m) => {
            const jira = getMessageJiraLink(m, jiraByMessage);
            const trello = getMessageTrelloLink(m, trelloByMessage);
            const github = getMessageGitHubLink(m, githubByMessage);
            const slack = getMessageSlackLink(m, slackByMessage);
            const showCreate = canCreateTask(m.classification);
            const c = m.classification;
            const d = c?.decision;
            const variant = classificationVariant(c);
            const hasDetails = Boolean(c && (c.reason || c.prefilter_reason || c.confidence != null || d));

            return (
              <article key={m.id} className={`te-msg te-msg--${variant}`}>
                <MessageAvatar
                  senderUrl={m.sender_avatar_url}
                  chatUrl={m.chat_avatar_url}
                  name={m.user_display_name || m.chat_title}
                  size={40}
                />
                <div className="te-msg__main">
                  <div className="te-msg__head">
                    <strong>{m.user_display_name || f.unknownUser}</strong>
                    {m.chat_title && <span className="te-msg__chat">{m.chat_title}</span>}
                    <time dateTime={m.created_at}>{formatShortTime(m.created_at, locale)}</time>
                    <MessageClassificationBadge classification={c} />
                  </div>

                  {m.text ? (
                    <p className="te-msg__text">{m.text}</p>
                  ) : (
                    !m.attachments?.length && <p className="te-msg__text is-muted">{f.mediaNoText}</p>
                  )}

                  {m.attachments && m.attachments.length > 0 && (
                    <div className="te-msg__media">
                      <AttachmentList attachments={m.attachments} compact />
                    </div>
                  )}

                  {hasDetails && c && (
                    <details className="te-why">
                      <summary>
                        {pf.details}
                        <CaretDown size={12} weight="bold" aria-hidden />
                      </summary>
                      <dl className="te-why__grid">
                        {c.confidence != null && (
                          <div>
                            <dt>{pf.score}</dt>
                            <dd>{pct(c.confidence)}</dd>
                          </div>
                        )}
                        {c.threshold != null && (
                          <div>
                            <dt>{pf.threshold}</dt>
                            <dd>{pct(c.threshold)}</dd>
                          </div>
                        )}
                        {d && (
                          <>
                            <div>
                              <dt>{pf.decision.probability}</dt>
                              <dd>{pct(d.is_task_probability)}</dd>
                            </div>
                            <div>
                              <dt>{pf.decision.type}</dt>
                              <dd>{d.task_type}</dd>
                            </div>
                            <div>
                              <dt>{pf.decision.priority}</dt>
                              <dd>{d.priority}</dd>
                            </div>
                            <div>
                              <dt>{pf.decision.complexity}</dt>
                              <dd>{pf.decision.complexityLabels[d.complexity] ?? d.complexity}</dd>
                            </div>
                            <div>
                              <dt>{pf.decision.urgency}</dt>
                              <dd>{d.urgency_score.toFixed(1)} / 2</dd>
                            </div>
                            <div>
                              <dt>{pf.decision.impact}</dt>
                              <dd>{d.impact_score.toFixed(1)} / 2</dd>
                            </div>
                            <div>
                              <dt>{pf.decision.deadline}</dt>
                              <dd>{pct(d.has_deadline_probability)}</dd>
                            </div>
                            <div>
                              <dt>{pf.decision.multiple}</dt>
                              <dd>{d.task_count === "multiple" ? pf.decision.yes : pf.decision.no}</dd>
                            </div>
                          </>
                        )}
                      </dl>
                      {c.reason && (
                        <p>
                          <b>{pf.reason}:</b> {c.reason}
                        </p>
                      )}
                      {c.prefilter_reason && (
                        <p>
                          <b>{pf.filter}:</b> {c.prefilter_reason}
                        </p>
                      )}
                      {c.is_task && !c.task_created && c.skip_reason === "ai_below_threshold" && <p>{pf.belowThreshold}</p>}
                      {c.requires_review && <p className="te-why__warn">{pf.needsReview}</p>}
                    </details>
                  )}

                  {(m.telegram_link || showCreate || jira || trello || github || slack) && (
                    <footer className="te-msg__foot">
                      {(jira || trello || github || slack) && (
                        <span className="te-msg__links">
                          {jira && <JiraLinkIcon link={jira} size={16} />}
                          {trello && <TrelloLinkIcon link={trello} size={16} />}
                          {github && <GitHubLinkIcon link={github} size={16} />}
                          {slack && <SlackLinkIcon link={slack} size={16} />}
                        </span>
                      )}
                      {m.telegram_link && (
                        <a className="te-btn te-btn--quiet te-btn--sm" href={m.telegram_link} target="_blank" rel="noreferrer">
                          {f.openTelegram}
                          <ArrowSquareOut size={14} aria-hidden />
                        </a>
                      )}
                      {showCreate && (
                        <button
                          type="button"
                          className="te-btn te-btn--primary te-btn--sm"
                          disabled={busyId === m.id}
                          onClick={() => handleCreate(m.id)}
                        >
                          <Plus size={14} weight="bold" aria-hidden />
                          {busyId === m.id ? f.creatingTask : f.createTask}
                        </button>
                      )}
                    </footer>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
