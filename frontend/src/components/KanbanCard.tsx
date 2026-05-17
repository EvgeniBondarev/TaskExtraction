import { Task } from "../api";
import { MessageAvatar } from "./MessageAvatar";
import { JiraLinkIcon } from "./JiraLinkIcon";
import { GitHubLinkIcon } from "./GitHubLinkIcon";
import { SlackLinkIcon } from "./SlackLinkIcon";
import { TrelloLinkIcon } from "./TrelloLinkIcon";
import { getTaskGitHubLink } from "../utils/githubIntegration";
import { getTaskJiraLink } from "../utils/jiraIntegration";
import { getTaskSlackLink } from "../utils/slackIntegration";
import { getTaskTrelloLink } from "../utils/trelloIntegration";
import { hasAttachments, PRIORITY_LABELS, STATUS_COLORS, TYPE_LABELS } from "../utils/taskStatus";

interface Props {
  task: Task;
  jiraActive?: boolean;
  trelloActive?: boolean;
  githubActive?: boolean;
  slackActive?: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function KanbanCard({
  task,
  jiraActive = false,
  trelloActive = false,
  githubActive = false,
  slackActive = false,
  onClick,
  onDragStart,
}: Props) {
  const jiraLinkRaw = getTaskJiraLink(task);
  const trelloLinkRaw = getTaskTrelloLink(task);
  const githubLinkRaw = getTaskGitHubLink(task);
  const slackLinkRaw = getTaskSlackLink(task);
  const jiraLink = jiraActive && jiraLinkRaw ? jiraLinkRaw : null;
  const trelloLink = trelloActive && trelloLinkRaw ? trelloLinkRaw : null;
  const githubLink = githubActive && githubLinkRaw ? githubLinkRaw : null;
  const slackLink = slackActive && slackLinkRaw ? slackLinkRaw : null;
  const accent = STATUS_COLORS[task.status] || STATUS_COLORS.inbox;
  const imageAtt = task.attachments?.find((a) => a.is_image && a.download_url);

  return (
    <article
      className={`kanban-card status-${task.status}`}
      style={{ "--card-accent": accent } as React.CSSProperties}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
      <div className="card-top">
        <span className={`pill type-${task.type}`}>{TYPE_LABELS[task.type] || task.type}</span>
        <span className={`pill priority-${task.priority}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>
        <span className="card-integrations">
          {jiraLink && <JiraLinkIcon link={jiraLink} className="card-jira" />}
          {trelloLink && <TrelloLinkIcon link={trelloLink} className="card-trello" />}
          {githubLink && <GitHubLinkIcon link={githubLink} className="card-github" />}
          {slackLink && <SlackLinkIcon link={slackLink} className="card-slack" />}
        </span>
      </div>

      <h3 className="card-title">{task.title}</h3>

      {task.description && <p className="card-desc">{task.description.slice(0, 120)}</p>}

      {imageAtt && (
        <div className="card-thumb">
          <img
            src={`${import.meta.env.VITE_API_URL || ""}${imageAtt.download_url}`}
            alt=""
            loading="lazy"
          />
        </div>
      )}

      <footer className="card-footer">
        <MessageAvatar
          senderUrl={task.source_sender_avatar_url}
          chatUrl={task.source_is_group ? task.source_chat_avatar_url : null}
          name={task.source_user_display_name || task.source_chat_title}
          size={28}
        />
        <div className="card-meta">
          <span className="author">{task.source_user_display_name || "Telegram"}</span>
          {task.source_is_group && task.source_chat_title && (
            <span className="chat">{task.source_chat_title}</span>
          )}
        </div>
        {hasAttachments(task) && <span className="att-icon" title="Есть вложения">📎</span>}
      </footer>

      <style>{`
        .kanban-card {
          --card-accent: #6366f1;
          position: relative;
          background: linear-gradient(145deg, #1e293b 0%, #172033 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 0.75rem 0.85rem 0.7rem;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s;
        }
        .kanban-card::before {
          content: "";
          position: absolute;
          left: 0; top: 10px; bottom: 10px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--card-accent);
        }
        .kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          border-color: color-mix(in srgb, var(--card-accent) 45%, transparent);
        }
        .kanban-card:active { cursor: grabbing; }
        .kanban-card.status-inbox { background: linear-gradient(145deg, #1a1f3a 0%, #151c2e 100%); }
        .kanban-card.status-in_progress { background: linear-gradient(145deg, #2a2218 0%, #1c1810 100%); }
        .kanban-card.status-done { background: linear-gradient(145deg, #14261c 0%, #121c16 100%); }
        .kanban-card.status-archive { opacity: 0.85; }
        .card-top {
          display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center;
          margin-bottom: 0.45rem;
        }
        .card-integrations { margin-left: auto; display: flex; gap: 0.3rem; }
        .pill {
          font-size: 0.62rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 0.15rem 0.4rem;
          border-radius: 5px;
          background: rgba(255,255,255,0.06);
          color: var(--muted);
        }
        .pill.type-bug { color: #fca5a5; background: rgba(248,113,113,0.12); }
        .pill.type-feature { color: #93c5fd; background: rgba(59,130,246,0.12); }
        .pill.priority-high { color: #fdba74; background: rgba(251,146,60,0.12); }
        .card-title {
          margin: 0 0 0.35rem;
          font-size: 0.92rem;
          font-weight: 600;
          line-height: 1.35;
          color: #f1f5f9;
        }
        .card-desc {
          margin: 0 0 0.5rem;
          font-size: 0.78rem;
          color: var(--muted);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-thumb {
          margin: 0.35rem 0 0.5rem;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .card-thumb img { display: block; width: 100%; max-height: 88px; object-fit: cover; }
        .card-footer {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 0.5rem;
          padding-top: 0.45rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .card-meta { min-width: 0; flex: 1; display: flex; flex-direction: column; }
        .author {
          font-size: 0.72rem;
          font-weight: 500;
          color: #cbd5e1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chat {
          font-size: 0.68rem;
          color: var(--accent);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .att-icon { font-size: 0.8rem; opacity: 0.7; flex-shrink: 0; }
      `}</style>
    </article>
  );
}
