import {
  ArrowCounterClockwise,
  ArrowRight,
  ChatCircleText,
  Check,
  CursorClick,
  Prohibit,
  Question,
  Tray,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useI18n, type PlaygroundMessage, type PlaygroundVerdict } from "../../i18n";
import { BrandMark } from "./BrandMark";

type Column = "inbox" | "progress" | "done";
type Reply = "progress" | "done" | "reopened";

const COLUMNS: Column[] = ["inbox", "progress", "done"];
const EASE = [0.16, 1, 0.3, 1] as const;
const SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

const VERDICT_ICON: Record<PlaygroundVerdict, typeof Tray> = {
  task: Tray,
  question: Question,
  noise: Prohibit,
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function MessagePlayground() {
  const { messages } = useI18n();
  const t = messages.landing.playground;
  const [selected, setSelected] = useState<number | null>(null);
  const [cards, setCards] = useState<Record<number, Column>>({});
  const [replies, setReplies] = useState<Record<number, Reply[]>>({});
  const resultRef = useRef<HTMLDivElement>(null);

  const current: PlaygroundMessage | null = selected === null ? null : t.messages[selected];
  const currentColumn = selected !== null ? cards[selected] : undefined;

  const pick = (index: number) => {
    setSelected(index);
    if (t.messages[index].verdict === "task") {
      setCards((prev) => (prev[index] ? prev : { ...prev, [index]: "inbox" }));
    }
    if (window.matchMedia("(max-width: 900px)").matches) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const move = (to: Column, reply: Reply) => {
    if (selected === null) return;
    setCards((prev) => ({ ...prev, [selected]: to }));
    setReplies((prev) => ({ ...prev, [selected]: [...(prev[selected] ?? []), reply] }));
  };

  const action =
    currentColumn === "inbox"
      ? { label: t.actions.start, icon: ArrowRight, run: () => move("progress", "progress") }
      : currentColumn === "progress"
        ? { label: t.actions.finish, icon: Check, run: () => move("done", "done") }
        : currentColumn === "done"
          ? { label: t.actions.reopen, icon: ArrowCounterClockwise, run: () => move("progress", "reopened") }
          : null;

  const hasReplies = Object.values(replies).some((list) => list.length > 0);

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
        <ol className="lnd-chat__list">
          {t.messages.map((msg, i) => {
            const isActive = selected === i;
            const verdictSeen = selected === i || cards[i] !== undefined;
            return (
              <li key={`${msg.author}-${msg.time}`}>
                <button
                  type="button"
                  className={`lnd-msg${isActive ? " is-active" : ""}`}
                  onClick={() => pick(i)}
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
                    {verdictSeen && (
                      <span className={`lnd-tag lnd-tag--${msg.verdict}`}>{t.verdict[msg.verdict]}</span>
                    )}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {(replies[i] ?? []).map((reply, n) => (
                    <motion.div
                      key={`${i}-${n}`}
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
      </div>

      <div className="lnd-result" ref={resultRef} aria-label={t.resultAria} aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current === null ? (
            <motion.div
              key="empty"
              className="lnd-result__empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CursorClick size={28} aria-hidden />
              <strong>{t.pick}</strong>
              <p>{t.pickHint}</p>
            </motion.div>
          ) : (
            <motion.div
              key={selected}
              className="lnd-result__card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <Verdict verdict={current.verdict} label={t.verdict[current.verdict]} note={t.verdictNote[current.verdict]} />
              {current.verdict === "task" && (
                <>
                  <dl className="lnd-fields">
                    <div className="lnd-fields__wide">
                      <dt>{t.fields.title}</dt>
                      <dd>{current.title}</dd>
                    </div>
                    <div>
                      <dt>{t.fields.type}</dt>
                      <dd>{current.type}</dd>
                    </div>
                    <div>
                      <dt>{t.fields.priority}</dt>
                      <dd>{current.priority}</dd>
                    </div>
                    <div>
                      <dt>{t.fields.due}</dt>
                      <dd>{current.due}</dd>
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
            const ids = Object.keys(cards)
              .map(Number)
              .filter((id) => cards[id] === col);
            return (
              <div className="lnd-board__col" key={col}>
                <div className="lnd-board__head">
                  <span>{t.columns[col]}</span>
                  <span className="lnd-board__count">{ids.length}</span>
                </div>
                {ids.length === 0 && <span className="lnd-board__empty">{t.empty}</span>}
                {ids.map((id) => (
                  <motion.button
                    type="button"
                    layout
                    layoutId={`lnd-card-${id}`}
                    transition={SPRING}
                    key={id}
                    className={`lnd-board__card${selected === id ? " is-active" : ""}`}
                    onClick={() => pick(id)}
                  >
                    {col === "done" && <Check size={14} weight="bold" aria-hidden />}
                    {t.messages[id].title}
                  </motion.button>
                ))}
              </div>
            );
          })}
        </div>

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
