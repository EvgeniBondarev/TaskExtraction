import { ArrowUpRight, Briefcase, GoogleLogo, TelegramLogo } from "@phosphor-icons/react";
import { motion, useInView, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n";
import { Reveal } from "./Reveal";

const ICONS = [GoogleLogo, TelegramLogo, Briefcase, ArrowUpRight];

function Step({ index, title, body }: { index: number; title: string; body: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Шаг «загорается», когда доходит до середины экрана: путь читается по порядку.
  const active = useInView(ref, { margin: "0px 0px -45% 0px" });
  const Icon = ICONS[index] ?? ArrowUpRight;
  return (
    <Reveal as="li" delay={index * 0.06}>
      <span ref={ref} className={`lnd-setup__icon${active ? " is-active" : ""}`} aria-hidden>
        <Icon size={22} weight={active ? "fill" : "regular"} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </Reveal>
  );
}

export function SetupSteps() {
  const { messages } = useI18n();
  const t = messages.landing.setup;
  const listRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 70%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  const [track, setTrack] = useState<{ top: number; height: number } | null>(null);

  // Линия идёт ровно от центра первой иконки до центра последней, при любой высоте текста.
  useLayoutEffect(() => {
    const wrap = listRef.current;
    if (!wrap) return;
    const measure = () => {
      const icons = wrap.querySelectorAll<HTMLElement>(".lnd-setup__icon");
      if (icons.length < 2) return;
      // offsetTop не учитывает transform, поэтому анимация появления шагов не сбивает расчёт.
      const center = (el: HTMLElement) => {
        let top = el.offsetHeight / 2;
        for (let node: HTMLElement | null = el; node && node !== wrap; node = node.offsetParent as HTMLElement | null) {
          top += node.offsetTop;
        }
        return top;
      };
      const top = center(icons[0]);
      setTrack({ top, height: center(icons[icons.length - 1]) - top });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [t.steps]);

  return (
    <section className="lnd-setup lnd-wrap" id="setup" aria-labelledby="lnd-setup-title">
      <div className="lnd-setup__intro">
        <h2 id="lnd-setup-title">{t.title}</h2>
        <p>{t.lead}</p>
      </div>
      <div className="lnd-setup__steps" ref={listRef}>
        <span className="lnd-setup__track" aria-hidden style={track ?? undefined}>
          <motion.span className="lnd-setup__fill" style={{ scaleY: reduce ? 1 : fill }} />
        </span>
        <ol className="lnd-setup__list">
          {t.steps.map((step, i) => (
            <Step key={step.title} index={i} title={step.title} body={step.body} />
          ))}
        </ol>
      </div>
    </section>
  );
}
