import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Props {
  bot: string;
  lines: string[];
}

/** Ответы бота приходят по очереди, с индикатором набора: так это выглядит в Telegram. */
export function ReplySequence({ bot, lines }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(lines.length);
      return;
    }
    const timers: number[] = [];
    let at = 300;
    lines.forEach((_, i) => {
      timers.push(window.setTimeout(() => setTyping(true), at));
      at += 900;
      timers.push(
        window.setTimeout(() => {
          setTyping(false);
          setShown(i + 1);
        }, at),
      );
      at += 700;
    });
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, lines]);

  return (
    <div className="lnd-replies" ref={ref} aria-hidden>
      <AnimatePresence initial={false}>
        {lines.slice(0, shown).map((line) => (
          <motion.span
            key={line}
            className="lnd-replies__bubble"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <small>{bot}</small>
            {line}
          </motion.span>
        ))}
        {typing && (
          <motion.span
            key="typing"
            className="lnd-replies__bubble lnd-replies__typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <i />
            <i />
            <i />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
