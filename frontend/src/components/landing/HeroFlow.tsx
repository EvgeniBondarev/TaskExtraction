import { CheckCircle, MagicWand, PaperPlaneTilt } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n";
import { useThemePref } from "../../utils/theme";

const EASE = [0.16, 1, 0.3, 1] as const;

type Point = { x: number; y: number };

function rightCenter(el: HTMLElement, parent: HTMLElement): Point {
  const box = el.getBoundingClientRect();
  const host = parent.getBoundingClientRect();
  return { x: box.right - host.left, y: box.top - host.top + box.height / 2 };
}

function leftCenter(el: HTMLElement, parent: HTMLElement): Point {
  const box = el.getBoundingClientRect();
  const host = parent.getBoundingClientRect();
  return { x: box.left - host.left, y: box.top - host.top + box.height / 2 };
}

/** A concise, semantic product story layered over the decorative hero render. */
export function HeroFlow() {
  const { locale } = useI18n();
  const [theme] = useThemePref();
  const reduce = useReducedMotion();
  const storyRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ width: number; height: number; messageToAi: string; aiToTask: string } | null>(null);
  const float = reduce ? undefined : { y: [0, -7, 0] };
  const isRu = locale === "ru";
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const updateConnections = useCallback(() => {
    const story = storyRef.current;
    const message = messageRef.current;
    const ai = aiRef.current;
    const task = taskRef.current;
    if (!story || !message || !ai || !task) return;
    const fromMessage = rightCenter(message, story);
    const toAi = rightCenter(ai, story);
    const fromAi = leftCenter(ai, story);
    const toTask = leftCenter(task, story);
    setConnections({
      width: story.clientWidth,
      height: story.clientHeight,
      messageToAi: `M ${fromMessage.x} ${fromMessage.y} C ${fromMessage.x + 48} ${fromMessage.y}, ${toAi.x + 52} ${toAi.y}, ${toAi.x} ${toAi.y}`,
      aiToTask: `M ${fromAi.x} ${fromAi.y} C ${fromAi.x - 38} ${fromAi.y}, ${toTask.x - 42} ${toTask.y}, ${toTask.x} ${toTask.y}`,
    });
  }, []);

  useLayoutEffect(() => {
    updateConnections();
    const observer = new ResizeObserver(updateConnections);
    [storyRef.current, messageRef.current, aiRef.current, taskRef.current].forEach((el) => el && observer.observe(el));
    window.addEventListener("resize", updateConnections);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateConnections);
    };
  }, [updateConnections]);

  return (
    <div className="lnd-flow" aria-label={isRu ? "Сообщение преобразуется в структурированную задачу" : "A message becomes a structured task"}>
      <img
        className="lnd-flow__art"
        src={isDark ? "/landing/premium/hero-flow-dark.webp" : "/landing/premium/hero-flow.webp"}
        alt=""
        width={1717}
        height={916}
      />
      <div className="lnd-flow__story" ref={storyRef}>
        {connections && (
          <svg className="lnd-flow__connections" viewBox={`0 0 ${connections.width} ${connections.height}`} preserveAspectRatio="none" aria-hidden>
            <path d={connections.messageToAi} />
            <path d={connections.aiToTask} />
          </svg>
        )}
        <motion.div
          ref={messageRef}
          className="lnd-flow__message"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.25, ease: EASE }}
          drag
          dragConstraints={storyRef}
          dragElastic={0.14}
          dragTransition={{ bounceStiffness: 360, bounceDamping: 22 }}
          onDrag={updateConnections}
          onDragEnd={updateConnections}
          whileHover={{ y: -3, scale: 1.012 }}
          whileTap={{ scale: 0.985, cursor: "grabbing" }}
        >
          <PaperPlaneTilt size={16} weight="fill" aria-hidden />
          <span>{isRu ? "Подготовь презентацию клиенту до пятницы" : "Prepare the client presentation by Friday"}</span>
        </motion.div>
        <motion.div
          ref={aiRef}
          className="lnd-flow__ai"
          animate={float}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          drag
          dragConstraints={storyRef}
          dragElastic={0.14}
          dragTransition={{ bounceStiffness: 360, bounceDamping: 22 }}
          onDrag={updateConnections}
          onDragEnd={updateConnections}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.985, cursor: "grabbing" }}
        >
          <MagicWand size={16} weight="fill" aria-hidden />
          <span>{isRu ? "ИИ понимает контекст" : "AI understands context"}</span>
        </motion.div>
        <motion.div
          ref={taskRef}
          className="lnd-flow__task"
          initial={{ opacity: 0, y: 16, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.72, delay: 0.7, ease: EASE }}
          drag
          dragConstraints={storyRef}
          dragElastic={0.14}
          dragTransition={{ bounceStiffness: 360, bounceDamping: 22 }}
          onDrag={updateConnections}
          onDragEnd={updateConnections}
          whileHover={{ y: -3, scale: 1.012 }}
          whileTap={{ scale: 0.985, cursor: "grabbing" }}
        >
          <span className="lnd-flow__task-state"><CheckCircle size={15} weight="fill" aria-hidden /> {isRu ? "Задача создана" : "Task created"}</span>
          <strong>{isRu ? "Подготовить презентацию клиенту" : "Prepare the client presentation"}</strong>
          <span>{isRu ? "Пятница · Назначено" : "Friday · Assigned"}</span>
        </motion.div>
      </div>
    </div>
  );
}
