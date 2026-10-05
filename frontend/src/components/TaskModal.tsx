import { ArrowSquareOut, Check, Prohibit, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { dismissTask, fetchTask, pushTask, Task, updateTask } from "../api";
import { useI18n } from "../i18n";
import { getTaskGitHubLink } from "../utils/githubIntegration";
import { getTaskJiraLink } from "../utils/jiraIntegration";
import { mediaUrl } from "../utils/mediaUrl";
import { getTaskSlackLink } from "../utils/slackIntegration";
import { hasAttachments, STATUS_ORDER } from "../utils/taskStatus";
import { getTaskTrelloLink } from "../utils/trelloIntegration";
import { formatFullTime } from "../utils/time";
import { AttachmentList } from "./AttachmentList";
import { IntegrationBrandIcon } from "./IntegrationBrandIcon";
import { MessageAvatar } from "./MessageAvatar";
import { TaskTelegramReply } from "./TaskTelegramReply";

type Provider = "jira" | "trello" | "github" | "slack";

const PROVIDER_NAMES: Record<Provider, string> = {
  jira: "Jira",
  trello: "Trello",
  github: "GitHub",
  slack: "Slack",
};

interface Props {
  task: Task;
  jiraEnabled?: boolean;
  trelloEnabled?: boolean;
  githubEnabled?: boolean;
  slackEnabled?: boolean;
  onClose: () => void;
  onUpdate: (t: Task) => void;
}

/** Карточка задачи в выезжающей справа панели. Поля сохраняются при потере фокуса. */
export function TaskModal({
  task,
  jiraEnabled = false,
  trelloEnabled = false,
  githubEnabled = false,
  slackEnabled = false,
  onClose,
  onUpdate,
}: Props) {
  const { locale, messages } = useI18n();
  const p = messages.panel;
  const tm = p.task;
  const labels = p.labels;
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [busy, setBusy] = useState(false);
  const [pushing, setPushing] = useState<Provider | null>(null);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setAssignee(task.assignee || "");
  }, [task.id, task.title, task.description, task.assignee]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const patch = async (body: Partial<Task>) => {
    setBusy(true);
    setError("");
    try {
      const updated = await updateTask(task.id, body);
      onUpdate(updated);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : tm.error);
    } finally {
      setBusy(false);
    }
  };

  const saveText = () => {
    const nextAssignee = assignee.trim() || null;
    if (
      title.trim() === task.title &&
      description === (task.description || "") &&
      nextAssignee === (task.assignee || null)
    ) {
      return;
    }
    if (!title.trim()) {
      setTitle(task.title);
      return;
    }
    void patch({ title: title.trim(), description, assignee: nextAssignee });
  };

  const dismiss = async () => {
    setBusy(true);
    try {
      onUpdate(await dismissTask(task.id));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : tm.error);
    } finally {
      setBusy(false);
    }
  };

  const pushTracker = async (provider: Provider) => {
    setPushing(provider);
    setError("");
    try {
      await pushTask(task.id, provider);
      onUpdate(await fetchTask(task.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : tm.error);
    } finally {
      setPushing(null);
    }
  };

  const links: Record<Provider, ReturnType<typeof getTaskJiraLink>> = {
    jira: getTaskJiraLink(task),
    trello: getTaskTrelloLink(task),
    github: getTaskGitHubLink(task),
    slack: getTaskSlackLink(task),
  };
  const enabled: Record<Provider, boolean> = {
    jira: jiraEnabled,
    trello: trelloEnabled,
    github: githubEnabled,
    slack: slackEnabled,
  };
  const providers = (Object.keys(PROVIDER_NAMES) as Provider[]).filter((id) => links[id] || enabled[id]);
  const created = formatFullTime(task.source_created_at || task.created_at, locale);

  return (
    <div className="te-sheet-layer" role="presentation">
      <motion.div
        className="te-sheet-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.aside
        className="te-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <header className="te-sheet__head te-glass">
          <div className="te-segment" role="radiogroup" aria-label={tm.status}>
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={task.status === s}
                className={`te-segment__item te-segment__item--${s}${task.status === s ? " is-active" : ""}`}
                disabled={busy}
                onClick={() => task.status !== s && patch({ status: s })}
              >
                {labels.status[s]}
              </button>
            ))}
          </div>
          <span className="te-sheet__saved" aria-live="polite">
            <AnimatePresence>
              {busy ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {tm.saving}
                </motion.span>
              ) : savedAt ? (
                <motion.span key={savedAt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Check size={14} weight="bold" aria-hidden /> {tm.saved}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
          <button ref={closeRef} type="button" className="te-icon-btn" onClick={onClose} aria-label={tm.close}>
            <X size={18} />
          </button>
        </header>

        <div className="te-sheet__body">
          <textarea
            className="te-sheet__title"
            value={title}
            rows={1}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveText}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              }
            }}
            placeholder={tm.titlePlaceholder}
            aria-label={tm.titlePlaceholder}
          />

          <div className="te-props">
            <label className="te-prop">
              <span>{tm.type}</span>
              <select className="te-select" value={task.type} disabled={busy} onChange={(e) => patch({ type: e.target.value })}>
                {Object.entries(labels.type).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="te-prop">
              <span>{tm.priority}</span>
              <select
                className="te-select"
                value={task.priority}
                disabled={busy}
                onChange={(e) => patch({ priority: e.target.value })}
              >
                {Object.entries(labels.priority).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="te-prop">
              <span>{tm.assignee}</span>
              <input
                className="te-input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                onBlur={saveText}
                placeholder={tm.assigneePlaceholder}
              />
            </label>
            {task.confidence != null && (
              <div className="te-prop">
                <span>{tm.confidence}</span>
                <strong className="te-prop__value">{Math.round(task.confidence * 100)}%</strong>
              </div>
            )}
          </div>

          <section className="te-source">
            <MessageAvatar
              senderUrl={task.source_sender_avatar_url}
              chatUrl={task.source_is_group ? task.source_chat_avatar_url : null}
              name={task.source_user_display_name || task.source_chat_title}
              size={40}
            />
            <div className="te-source__who">
              <strong>{task.source_user_display_name || tm.sender}</strong>
              <span>
                {task.source_is_group && task.source_chat_title && (
                  <>
                    {task.source_chat_avatar_url && (
                      <img className="te-source__chat-img" src={mediaUrl(task.source_chat_avatar_url)} alt="" />
                    )}
                    {task.source_chat_title}
                    {" · "}
                  </>
                )}
                {created}
              </span>
            </div>
            {task.telegram_link && (
              <a className="te-btn te-btn--ghost te-btn--sm" href={task.telegram_link} target="_blank" rel="noreferrer">
                {tm.openTelegram}
                <ArrowSquareOut size={14} aria-hidden />
              </a>
            )}
          </section>

          <label className="te-field">
            <span className="te-field__label">{tm.description}</span>
            <textarea
              className="te-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveText}
              rows={5}
              placeholder={tm.descriptionPlaceholder}
            />
          </label>

          {hasAttachments(task) && (
            <section className="te-field">
              <span className="te-field__label">{tm.attachments}</span>
              <AttachmentList attachments={task.attachments!} />
            </section>
          )}

          {providers.length > 0 && (
            <section className="te-field">
              <span className="te-field__label">{tm.trackers}</span>
              <div className="te-trackers">
                {providers.map((id) => {
                  const link = links[id];
                  const name = PROVIDER_NAMES[id];
                  return link ? (
                    <a key={id} className="te-tracker is-linked" href={link.url} target="_blank" rel="noreferrer">
                      <IntegrationBrandIcon provider={id} size={18} />
                      <span>{tm.openIn.replace("{name}", name)}</span>
                      {link.external_id && <code>{link.external_id}</code>}
                      <ArrowSquareOut size={14} aria-hidden />
                    </a>
                  ) : (
                    <button
                      key={id}
                      type="button"
                      className="te-tracker"
                      disabled={pushing !== null}
                      onClick={() => pushTracker(id)}
                    >
                      <IntegrationBrandIcon provider={id} size={18} />
                      <span>{pushing === id ? tm.sending : tm.sendTo.replace("{name}", name)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {error && (
            <p className="te-alert te-alert--error" role="alert">
              {error}
            </p>
          )}

          <TaskTelegramReply task={task} />
        </div>

        <footer className="te-sheet__foot">
          <button type="button" className="te-btn te-btn--danger-ghost te-btn--sm" onClick={dismiss} disabled={busy}>
            <Prohibit size={16} aria-hidden />
            {tm.notTask}
          </button>
          <span className="te-sheet__foot-hint">{tm.notTaskHint}</span>
        </footer>
      </motion.aside>
    </div>
  );
}
