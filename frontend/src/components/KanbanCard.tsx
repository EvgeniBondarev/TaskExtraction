import { ArrowRight, Paperclip } from "@phosphor-icons/react";
import { Task } from "../api";
import { useI18n } from "../i18n";
import { getTaskGitHubLink } from "../utils/githubIntegration";
import { getTaskJiraLink } from "../utils/jiraIntegration";
import { getTaskSlackLink } from "../utils/slackIntegration";
import { getTaskTrelloLink } from "../utils/trelloIntegration";
import { hasAttachments, nextStatus } from "../utils/taskStatus";
import { formatShortTime } from "../utils/time";
import { GitHubLinkIcon } from "./GitHubLinkIcon";
import { JiraLinkIcon } from "./JiraLinkIcon";
import { MessageAvatar } from "./MessageAvatar";
import { ImageWithSkeleton } from "./ImageWithSkeleton";
import { SlackLinkIcon } from "./SlackLinkIcon";
import { TrelloLinkIcon } from "./TrelloLinkIcon";

interface Props {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onMove?: (status: string) => void;
}

export function KanbanCard({ task, onClick, onDragStart, onDragEnd, onMove }: Props) {
  const { locale, messages } = useI18n();
  const p = messages.panel;
  const labels = p.labels;
  const jira = getTaskJiraLink(task);
  const trello = getTaskTrelloLink(task);
  const github = getTaskGitHubLink(task);
  const slack = getTaskSlackLink(task);
  const image = task.attachments?.find((a) => a.is_image && a.download_url);
  const attachmentCount = task.attachments?.length ?? 0;
  const next = task.status === "archive" ? null : nextStatus(task.status);
  const nextLabel = next ? labels.status[next as keyof typeof labels.status] : "";
  const typeLabel = labels.type[task.type as keyof typeof labels.type] ?? task.type;
  const priorityLabel = labels.priority[task.priority as keyof typeof labels.priority] ?? task.priority;
  const when = formatShortTime(task.source_created_at || task.created_at, locale);

  return (
    <article
      className={`te-card te-card--${task.status}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={task.title}
    >
      <div className="te-card__tags">
        <span className={`te-prio te-prio--${task.priority}`} title={`${p.task.priority}: ${priorityLabel}`}>
          <span className="te-prio__bars" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          {priorityLabel}
        </span>
        <span className={`te-tag te-tag--${task.type}`}>{typeLabel}</span>
        {(jira || trello || github || slack) && (
          <span className="te-card__links">
            {jira && <JiraLinkIcon link={jira} size={16} />}
            {trello && <TrelloLinkIcon link={trello} size={16} />}
            {github && <GitHubLinkIcon link={github} size={16} />}
            {slack && <SlackLinkIcon link={slack} size={16} />}
          </span>
        )}
      </div>

      <h3 className="te-card__title">{task.title}</h3>
      {task.description && task.description.trim() !== task.title.trim() && (
        <p className="te-card__desc">{task.description}</p>
      )}

      {image && (
        <div className="te-card__thumb">
          <ImageWithSkeleton src={`${import.meta.env.VITE_API_URL || ""}${image.download_url}`} alt="" loading="lazy" />
        </div>
      )}

      <footer className="te-card__foot">
        <MessageAvatar
          senderUrl={task.source_sender_avatar_url}
          chatUrl={task.source_is_group ? task.source_chat_avatar_url : null}
          name={task.source_user_display_name || task.source_chat_title}
          size={24}
        />
        <span className="te-card__who">
          <span className="te-card__author">{task.source_user_display_name || "Telegram"}</span>
          {task.source_is_group && task.source_chat_title && (
            <span className="te-card__chat">{task.source_chat_title}</span>
          )}
        </span>
        {hasAttachments(task) && (
          <span
            className="te-card__attachment"
            aria-label={p.board.attachmentsCount.replace("{count}", String(attachmentCount))}
            title={p.board.attachmentsCount.replace("{count}", String(attachmentCount))}
          >
            <Paperclip size={14} weight="bold" aria-hidden />
            <b>{attachmentCount}</b>
          </span>
        )}
        {when && <time className="te-card__time">{when}</time>}
        {next && onMove && (
          <button
            type="button"
            className="te-card__move"
            title={p.board.moveTo.replace("{status}", nextLabel)}
            aria-label={p.board.moveTo.replace("{status}", nextLabel)}
            onClick={(e) => {
              e.stopPropagation();
              onMove(next);
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ArrowRight size={14} weight="bold" />
          </button>
        )}
      </footer>
    </article>
  );
}
