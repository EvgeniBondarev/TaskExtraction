import { useEffect, useState } from "react";
import { dismissTask, pushTask, Task, updateTask } from "../api";
import { AttachmentList } from "./AttachmentList";
import { MessageAvatar } from "./MessageAvatar";
import { mediaUrl } from "../utils/mediaUrl";
import {
  backActionLabel,
  hasAttachments,
  prevStatus,
  primaryAction,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_LABELS,
} from "../utils/taskStatus";
import { getTaskJiraLink } from "../utils/jiraIntegration";
import { getTaskGitHubLink } from "../utils/githubIntegration";
import { getTaskSlackLink } from "../utils/slackIntegration";
import { getTaskTrelloLink } from "../utils/trelloIntegration";

interface Props {
  task: Task;
  jiraActive?: boolean;
  trelloActive?: boolean;
  githubActive?: boolean;
  jiraEnabled?: boolean;
  trelloEnabled?: boolean;
  githubEnabled?: boolean;
  slackActive?: boolean;
  slackEnabled?: boolean;
  onClose: () => void;
  onUpdate: (t: Task) => void;
}

export function TaskModal({
  task,
  jiraActive = false,
  trelloActive = false,
  githubActive = false,
  jiraEnabled = false,
  trelloEnabled = false,
  githubEnabled = false,
  slackActive = false,
  slackEnabled = false,
  onClose,
  onUpdate,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setAssignee(task.assignee || "");
  }, [task.id, task.title, task.description, task.assignee]);

  const accent = STATUS_COLORS[task.status] || STATUS_COLORS.inbox;
  const action = primaryAction(task.status);
  const backLabel = backActionLabel(task.status);
  const prev = prevStatus(task.status);

  const patch = async (patch: Partial<Task> & { status?: string }) => {
    setBusy(true);
    setError("");
    try {
      const updated = await updateTask(task.id, patch);
      onUpdate(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const saveFields = () => patch({ title, description, assignee: assignee || null });

  const moveTo = async (status: string) => {
    await patch({ status });
    if (status === "archive" && task.status !== "archive") {
      /* keep modal open for archive from done */
    }
  };

  const dismiss = async () => {
    setBusy(true);
    try {
      const updated = await dismissTask(task.id);
      onUpdate(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const pushTracker = async (provider: string) => {
    setPushing(true);
    setError("");
    try {
      await pushTask(task.id, provider);
      const refreshed = (await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/tasks/${task.id}`
      ).then((r) => r.json())) as Task;
      onUpdate(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPushing(false);
    }
  };

  const jiraLink = getTaskJiraLink(task);
  const trelloLink = getTaskTrelloLink(task);
  const githubLink = getTaskGitHubLink(task);
  const slackLink = getTaskSlackLink(task);
  const hasJira = Boolean(jiraLink);
  const hasTrello = Boolean(trelloLink);
  const hasGitHub = Boolean(githubLink);
  const hasSlack = Boolean(slackLink);

  const created = task.source_created_at
    ? new Date(task.source_created_at).toLocaleString("ru")
    : new Date(task.created_at).toLocaleString("ru");

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        style={{ "--modal-accent": accent } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-header">
          <span className="status-pill" style={{ background: `${accent}22`, color: accent }}>
            {STATUS_LABELS[task.status] || task.status}
          </span>
          <button type="button" className="close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <input
          className="title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveFields}
          placeholder="Название задачи"
        />

        <section className="source-row">
          <MessageAvatar
            senderUrl={task.source_sender_avatar_url}
            chatUrl={task.source_is_group ? task.source_chat_avatar_url : null}
            name={task.source_user_display_name || task.source_chat_title}
            size={44}
          />
          <div className="source-text">
            <strong>{task.source_user_display_name || "Отправитель"}</strong>
            {task.source_is_group && task.source_chat_title && (
              <span className="chat-line">
                {task.source_chat_avatar_url && (
                  <img
                    className="chat-mini"
                    src={mediaUrl(task.source_chat_avatar_url)}
                    alt=""
                  />
                )}
                {task.source_chat_title}
              </span>
            )}
            <span className="date-line">{created}</span>
          </div>
          <div className="source-links">
            {task.telegram_link && (
              <a className="tg-link" href={task.telegram_link} target="_blank" rel="noreferrer">
                Telegram
              </a>
            )}
            {jiraActive && hasJira && jiraLink && (
              <a className="jira-link" href={jiraLink.url} target="_blank" rel="noreferrer">
                Просмотр в Jira
              </a>
            )}
            {trelloActive && hasTrello && trelloLink && (
              <a className="trello-link" href={trelloLink.url} target="_blank" rel="noreferrer">
                Просмотр в Trello
              </a>
            )}
            {githubActive && hasGitHub && githubLink && (
              <a className="github-link" href={githubLink.url} target="_blank" rel="noreferrer">
                Просмотр в GitHub
              </a>
            )}
            {slackActive && hasSlack && slackLink && (
              <a className="slack-link" href={slackLink.url} target="_blank" rel="noreferrer">
                Просмотр в Slack
              </a>
            )}
          </div>
        </section>

        <div className="tags">
          <span className={`tag type-${task.type}`}>{TYPE_LABELS[task.type] || task.type}</span>
          <span className={`tag priority-${task.priority}`}>
            {PRIORITY_LABELS[task.priority] || task.priority}
          </span>
          {task.confidence != null && (
            <span className="tag muted">AI {Math.round(task.confidence * 100)}%</span>
          )}
        </div>

        <section className="section">
          <h3>Описание</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveFields}
            rows={5}
            placeholder="Добавьте описание…"
          />
        </section>

        {hasAttachments(task) && (
          <section className="section">
            <h3>Вложения</h3>
            <AttachmentList attachments={task.attachments!} />
          </section>
        )}

        <section className="section compact">
          <h3>Исполнитель</h3>
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            onBlur={saveFields}
            placeholder="Не назначен"
          />
        </section>

        {task.external_links.length > 0 && (
          <ul className="ext-links">
            {task.external_links.map((l) => (
              <li key={l.id}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.provider} #{l.external_id}
                </a>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="error">{error}</p>}

        <footer className="modal-footer">
          <div className="actions-primary">
            {action && (
              <button
                type="button"
                className="btn primary"
                style={{ background: accent }}
                disabled={busy}
                onClick={() => moveTo(action.next)}
              >
                {busy ? "…" : action.label}
              </button>
            )}
            {prev && backLabel && (
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => moveTo(prev)}
              >
                {backLabel}
              </button>
            )}
          </div>
          <div className="actions-secondary">
            {jiraEnabled && !hasJira && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => pushTracker("jira")}
                disabled={pushing}
              >
                {pushing ? "…" : "Отправить в Jira"}
              </button>
            )}
            {trelloEnabled && !hasTrello && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => pushTracker("trello")}
                disabled={pushing}
              >
                {pushing ? "…" : "Отправить в Trello"}
              </button>
            )}
            {githubEnabled && !hasGitHub && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => pushTracker("github")}
                disabled={pushing}
              >
                {pushing ? "…" : "Отправить в GitHub"}
              </button>
            )}
            {slackEnabled && !hasSlack && (
              <button
                type="button"
                className="btn ghost"
                onClick={() => pushTracker("slack")}
                disabled={pushing}
              >
                {pushing ? "…" : "Отправить в Slack"}
              </button>
            )}
            <button type="button" className="btn ghost danger" onClick={dismiss} disabled={busy}>
              Не задача
            </button>
          </div>
        </footer>

        <style>{`
          .overlay {
            position: fixed; inset: 0;
            background: rgba(8, 12, 20, 0.72);
            backdrop-filter: blur(6px);
            display: flex; align-items: flex-start; justify-content: center;
            z-index: 200; padding: 2rem 1rem; overflow-y: auto;
          }
          .modal {
            --modal-accent: #6366f1;
            width: 100%; max-width: 560px;
            background: linear-gradient(180deg, #1e293b 0%, #151d2b 100%);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.45);
            padding: 1.25rem 1.35rem 1.35rem;
            animation: modal-in 0.22s ease-out;
          }
          @keyframes modal-in {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to { opacity: 1; transform: none; }
          }
          .modal-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 0.75rem;
          }
          .status-pill {
            font-size: 0.72rem; font-weight: 600;
            padding: 0.2rem 0.55rem; border-radius: 6px;
          }
          .close {
            background: rgba(255,255,255,0.06); border: none;
            color: var(--muted); font-size: 1.35rem; line-height: 1;
            width: 2rem; height: 2rem; border-radius: 8px;
          }
          .close:hover { color: var(--text); background: rgba(255,255,255,0.1); }
          .title-input {
            width: 100%; background: transparent; border: none;
            color: #f8fafc; font-size: 1.25rem; font-weight: 700;
            line-height: 1.3; margin-bottom: 1rem; padding: 0;
          }
          .title-input:focus { outline: none; }
          .source-row {
            display: flex; align-items: flex-start; gap: 0.75rem;
            padding: 0.75rem; border-radius: 10px;
            background: rgba(0,0,0,0.2); margin-bottom: 0.85rem;
          }
          .source-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
          .source-text strong { font-size: 0.9rem; }
          .chat-line {
            display: flex; align-items: center; gap: 0.35rem;
            font-size: 0.8rem; color: var(--accent);
          }
          .chat-mini { width: 16px; height: 16px; border-radius: 50%; object-fit: cover; }
          .date-line { font-size: 0.72rem; color: var(--muted); }
          .source-links {
            display: flex; flex-direction: column; gap: 0.35rem; flex-shrink: 0;
          }
          .tg-link, .jira-link, .trello-link, .github-link, .slack-link {
            font-size: 0.75rem; font-weight: 500;
            padding: 0.35rem 0.55rem; border-radius: 6px;
            text-decoration: none; text-align: center;
          }
          .tg-link { background: rgba(59,130,246,0.15); color: #93c5fd; }
          .jira-link { background: rgba(38,132,255,0.15); color: #4c9aff; }
          .trello-link { background: rgba(0,121,191,0.15); color: #5eb3e8; }
          .github-link { background: rgba(35,134,54,0.15); color: #7ee787; }
          .slack-link { background: rgba(224,30,90,0.15); color: #ff6b9d; }
          .tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
          .tag {
            font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
            padding: 0.15rem 0.45rem; border-radius: 5px;
            background: rgba(255,255,255,0.06); color: var(--muted);
          }
          .tag.type-bug { color: #fca5a5; }
          .tag.type-feature { color: #93c5fd; }
          .tag.priority-high { color: #fdba74; }
          .section { margin-bottom: 1rem; }
          .section.compact input { margin-top: 0.25rem; }
          .section h3 {
            margin: 0 0 0.4rem; font-size: 0.72rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
          }
          textarea, .section input {
            width: 100%; background: rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.08);
            color: var(--text); border-radius: 10px; padding: 0.65rem 0.75rem;
            font: inherit; line-height: 1.45; resize: vertical;
          }
          textarea:focus, .section input:focus {
            outline: none; border-color: color-mix(in srgb, var(--modal-accent) 50%, transparent);
          }
          .ext-links { margin: 0 0 1rem; padding-left: 1.1rem; font-size: 0.85rem; }
          .error { color: #f87171; font-size: 0.85rem; margin: 0 0 0.5rem; }
          .modal-footer {
            display: flex; flex-direction: column; gap: 0.65rem;
            margin-top: 0.5rem; padding-top: 1rem;
            border-top: 1px solid rgba(255,255,255,0.06);
          }
          .actions-primary, .actions-secondary {
            display: flex; flex-wrap: wrap; gap: 0.5rem;
          }
          .btn {
            border: none; border-radius: 9px; padding: 0.55rem 1rem;
            font-size: 0.88rem; font-weight: 600; cursor: pointer;
          }
          .btn:disabled { opacity: 0.55; cursor: wait; }
          .btn.primary { color: #fff; flex: 1; min-width: 140px; }
          .btn.secondary {
            background: rgba(255,255,255,0.08); color: var(--text);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .btn.ghost {
            background: transparent; color: var(--muted);
            border: 1px solid rgba(255,255,255,0.08);
            font-weight: 500;
          }
          .btn.ghost.danger { color: #f87171; border-color: rgba(248,113,113,0.35); }
          .btn.primary:hover:not(:disabled) { filter: brightness(1.08); }
        `}</style>
      </div>
    </div>
  );
}
