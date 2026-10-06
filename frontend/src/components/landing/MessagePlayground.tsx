import {
  ArrowCounterClockwise,
  ArrowRight,
  ChatCircleText,
  Check,
  CircleNotch,
  CursorClick,
  DotsSixVertical,
  Lightbulb,
  MinusCircle,
  PaperPlaneRight,
  Prohibit,
  Question,
  Sparkle,
  Tray,
  WarningCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { classifyDemoMessage, DemoError } from "../../api/demo";
import { useI18n, type PlaygroundVerdict } from "../../i18n";
import { BrandMark } from "./BrandMark";

type Column = "inbox" | "progress" | "done";
type Reply = "progress" | "done" | "reopened" | "inbox";

interface ChatItem {
  id: string;
  author: string;
  time: string;
  text: string;
  live: boolean;
  status: "ready" | "loading" | "error";
  verdict?: PlaygroundVerdict;
  title?: string;
  type?: string;
  priority?: string;
  due?: string;
  confidence?: number | null;
  threshold?: number;
  error?: string;
}

const COLUMNS: Column[] = ["inbox", "progress", "done"];
const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;
const MAX_CHARS = 400;

const VERDICT_ICON: Record<PlaygroundVerdict, typeof Tray> = {
  task: Tray,
  question: Question,
  noise: Prohibit,
  candidate: Lightbulb,
  not_task: MinusCircle,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Какой ответ бот пишет в чат при переносе карточки (как в telegram_reply.py). */
function replyFor(from: Column, to: Column): Reply | null {
  if (from === to) return null;
  if (to === "progress") return from === "done" ? "reopened" : "progress";
  if (to === "done") return "done";
  return "inbox";
}

export function MessagePlayground() {
  const { messages } = useI18n();
  const t = messages.landing.playground;
  const live = t.live;

  const presets: ChatItem[] = useMemo(
    () =>
      t.messages.map((m, i) => ({
        id: `p${i}`,
        author: m.author,
        time: m.time,
        text: m.text,
        live: false,
        status: "ready",
        verdict: m.verdict,
        title: m.title,
        type: m.type,
        priority: m.priority,
        due: m.due,
      })),
    [t.messages],
  );

  const [userItems, setUserItems] = useState<ChatItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [cards, setCards] = useState<Record<string, Column>>({});
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [draft, setDraft] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Column | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => [...presets, ...userItems], [presets, userItems]);
  const byId = (id: string) => items.find((i) => i.id === id);
  const current = selected ? byId(selected) ?? null : null;
  const currentColumn = selected ? cards[selected] : undefined;
  const busy = userItems.some((i) => i.status === "loading");
  // Пока пользователь ничего не трогал, первое сообщение мягко подсказывает, что на него можно нажать.
  const [touched, setTouched] = useState(false);
  const showHint = !touched && selected === null && userItems.length === 0;

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [userItems.length]);

  const revealResult = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const pick = (id: string) => {
    setTouched(true);
    setSelected(id);
    const item = byId(id);
    if (item?.status === "ready" && item.verdict === "task") {
      setCards((prev) => (prev[id] ? prev : { ...prev, [id]: "inbox" }));
    }
    revealResult();
  };

  const move = (id: string, to: Column) => {
    const from = cards[id];
    if (!from) return;
    const reply = replyFor(from, to);
    if (!reply) return;
    setCards((prev) => ({ ...prev, [id]: to }));
    setReplies((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), reply] }));
    setSelected(id);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const id = `u${Date.now()}`;
    setUserItems((prev) => [...prev, { id, author: live.you, time: nowTime(), text, live: true, status: "loading" }]);
    setSelected(id);
    setDraft("");
    revealResult();
    try {
      const res = await classifyDemoMessage(text);
      const verdict: PlaygroundVerdict =
        res.verdict === "task" ? "task" : res.verdict === "candidate" ? "candidate" : res.verdict === "noise" ? "noise" : "not_task";
      setUserItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: "ready",
                verdict,
                title: res.title ?? undefined,
                type: res.type ? t.types[res.type as keyof typeof t.types] ?? res.type : undefined,
                priority: res.priority ? t.priorities[res.priority as keyof typeof t.priorities] ?? res.priority : undefined,
                due: res.has_deadline == null ? undefined : res.has_deadline ? live.deadlineYes : live.deadlineNo,
                confidence: res.confidence,
                threshold: res.threshold,
              }
            : i,
        ),
      );
      if (verdict === "task") setCards((prev) => ({ ...prev, [id]: "inbox" }));
    } catch (e) {
      const message = e instanceof DemoError && e.status === 429 && e.message ? e.message : live.error;
      setUserItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "error", error: message } : i)));
    }
  };

  const action =
    selected && currentColumn === "inbox"
      ? { label: t.actions.start, icon: ArrowRight, run: () => move(selected, "progress") }
      : selected && currentColumn === "progress"
        ? { label: t.actions.finish, icon: Check, run: () => move(selected, "done") }
        : selected && currentColumn === "done"
          ? { label: t.actions.reopen, icon: ArrowCounterClockwise, run: () => move(selected, "progress") }
          : null;

  const hasReplies = Object.values(replies).some((list) => list.length > 0);
  const hasCards = Object.keys(cards).length > 0;

  return (
    <div className="lnd-play">
      <div className="lnd-chat">
        <header className="lnd-chat__head">
          <span className="lnd-chat__avatar" aria-hidden>
            <BrandMark brand="telegram" size={18} />
          </span>
          <span>
            <strong>{t.chatTitle}</strong>
            <small>{t.chatMeta}</small>
          </span>
        </header>
        <ol className="lnd-chat__list" ref={listRef}>
          {items.map((msg) => {
            const isActive = selected === msg.id;
            const verdictSeen = msg.status === "ready" && (isActive || cards[msg.id] !== undefined || msg.live);
            return (
              <li key={msg.id}>
                <button
                  type="button"
                  className={`lnd-msg${isActive ? " is-active" : ""}${msg.live ? " is-own" : ""}${showHint && msg.id === "p0" ? " is-hint" : ""}`}
                  onClick={() => pick(msg.id)}
                  aria-pressed={isActive}
                >
                  <span className="lnd-msg__avatar" aria-hidden>
                    {initials(msg.author)}
                  </span>
                  <span className="lnd-msg__body">
                    <span className="lnd-msg__meta">
                      <strong>{msg.author}</strong>
                      <time>{msg.time}</time>
                    </span>
                    <span className="lnd-msg__text">{msg.text}</span>
                    {showHint && msg.id === "p0" && <span className="lnd-msg__hint">{live.tryHint}</span>}
                    {msg.status === "loading" && (
                      <span className="lnd-tag lnd-tag--loading">
                        <CircleNotch size={12} weight="bold" className="lnd-spin" aria-hidden />
                        {live.analyzing}
                      </span>
                    )}
                    {msg.status === "error" && <span className="lnd-tag lnd-tag--error">{msg.error}</span>}
                    {verdictSeen && msg.verdict && (
                      <span className={`lnd-tag lnd-tag--${msg.verdict}`}>{t.verdict[msg.verdict]}</span>
                    )}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {(replies[msg.id] ?? []).map((reply, n) => (
                    <motion.div
                      key={`${msg.id}-${n}`}
                      className="lnd-reply"
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      <span className="lnd-reply__quote">{msg.text}</span>
                      <span className="lnd-reply__bot">{t.bot}</span>
                      <span className="lnd-reply__text">{t.replies[reply]}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
        <form
          className="lnd-compose"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            value={draft}
            maxLength={MAX_CHARS}
            rows={2}
            onChange={(e) => {
              setDraft(e.target.value);
              setTouched(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={live.placeholder}
            aria-label={live.placeholder}
          />
          <button type="submit" className="lnd-btn lnd-btn--primary lnd-btn--sm" disabled={!draft.trim() || busy}>
            <PaperPlaneRight size={16} weight="fill" aria-hidden />
            <span className="lnd-compose__label">{live.send}</span>
          </button>
        </form>
      </div>

      <div className="lnd-result" ref={resultRef} aria-label={t.resultAria} aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current === null ? (
            <motion.div key="empty" className="lnd-result__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CursorClick size={28} aria-hidden />
              <strong>{t.pick}</strong>
              <p>{t.pickHint}</p>
            </motion.div>
          ) : current.status === "loading" ? (
            <motion.div key={`${current.id}-loading`} className="lnd-result__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CircleNotch size={28} className="lnd-spin" aria-hidden />
              <strong>{live.analyzing}</strong>
              <p className="lnd-result__quote">«{current.text}»</p>
            </motion.div>
          ) : current.status === "error" ? (
            <motion.div key={`${current.id}-error`} className="lnd-result__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WarningCircle size={28} aria-hidden />
              <strong>{current.error}</strong>
            </motion.div>
          ) : (
            <motion.div
              key={current.id}
              className="lnd-result__card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <div className="lnd-result__top">
                <Verdict verdict={current.verdict!} label={t.verdict[current.verdict!]} note={t.verdictNote[current.verdict!]} />
                <span className={`lnd-source${current.live ? " is-live" : ""}`}>
                  {current.live ? <Sparkle size={13} weight="fill" aria-hidden /> : null}
                  {current.live ? live.badge : live.sample}
                </span>
              </div>
              {current.live && current.confidence != null && (
                <p className="lnd-score">
                  {live.confidence} <b>{current.confidence.toFixed(2)}</b>
                  <span aria-hidden>·</span>
                  {live.threshold} {(current.threshold ?? 0.75).toFixed(2)}
                </p>
              )}
              {current.verdict === "task" && (
                <>
                  <dl className="lnd-fields">
                    <div className="lnd-fields__wide">
                      <dt>{t.fields.title}</dt>
                      <dd>{current.title}</dd>
                    </div>
                    <div>
                      <dt>{t.fields.type}</dt>
                      <dd>{current.type ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>{t.fields.priority}</dt>
                      <dd>{current.priority ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>{t.fields.due}</dt>
                      <dd>{current.due ?? "-"}</dd>
                    </div>
                  </dl>
                  <div className="lnd-result__foot">
                    <span className="lnd-pushed">
                      {t.pushed}
                      <BrandMark brand="jira" size={16} />
                      <BrandMark brand="slack" size={16} />
                    </span>
                    {action && (
                      <button type="button" className="lnd-btn lnd-btn--primary lnd-btn--sm" onClick={action.run}>
                        {action.label}
                        <action.icon size={16} weight="bold" aria-hidden />
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="lnd-board">
          {COLUMNS.map((col) => {
            const ids = Object.keys(cards).filter((id) => cards[id] === col);
            return (
              <div
                className={`lnd-board__col${overCol === col ? " is-over" : ""}`}
                key={col}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overCol !== col) setOverCol(col);
                }}
                onDragLeave={(e) => {
                  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setOverCol(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) move(id, col);
                  setDragId(null);
                  setOverCol(null);
                }}
              >
                <div className="lnd-board__head">
                  <span>{t.columns[col]}</span>
                  <span className="lnd-board__count">{ids.length}</span>
                </div>
                {ids.length === 0 && <span className="lnd-board__empty">{t.empty}</span>}
                {ids.map((id) => (
                  <motion.div layout layoutId={`lnd-card-${id}`} transition={SPRING} key={id}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      className={`lnd-board__card${selected === id ? " is-active" : ""}${dragId === id ? " is-dragging" : ""}`}
                      onClick={() => pick(id)}
                    >
                      <DotsSixVertical size={14} className="lnd-board__grip" aria-hidden />
                      {col === "done" && <Check size={14} weight="bold" aria-hidden />}
                      <span>{byId(id)?.title}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>

        {hasCards && <p className="lnd-result__note">{live.dragHint}</p>}
        {hasReplies && (
          <p className="lnd-result__note">
            <ChatCircleText size={16} aria-hidden />
            {t.replyNote}
          </p>
        )}
      </div>
    </div>
  );
}

function Verdict({ verdict, label, note }: { verdict: PlaygroundVerdict; label: string; note: string }) {
  const Icon = VERDICT_ICON[verdict];
  return (
    <div className={`lnd-verdict lnd-verdict--${verdict}`}>
      <span className="lnd-verdict__icon" aria-hidden>
        <Icon size={20} weight="bold" />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{note}</small>
      </span>
    </div>
  );
}
