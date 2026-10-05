import { ArrowDown } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "../../i18n";

interface Props {
  onOpen: () => void;
  onExample: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function LandingHero({ onOpen, onExample }: Props) {
  const { messages } = useI18n();
  const t = messages.landing;
  const reduce = useReducedMotion();

  const item = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: 0.08 * i, ease: EASE },
  });

  return (
    <section className="lnd-hero lnd-wrap">
      <div className="lnd-hero__copy">
        <motion.h1 {...item(0)}>{t.hero.title}</motion.h1>
        <motion.p className="lnd-hero__lead" {...item(1)}>
          {t.hero.lead}
        </motion.p>
        <motion.div className="lnd-hero__actions" {...item(2)}>
          <button type="button" className="lnd-btn lnd-btn--primary" onClick={onOpen}>
            {t.cta.open}
          </button>
          <button type="button" className="lnd-btn lnd-btn--ghost" onClick={onExample}>
            {t.cta.example}
            <ArrowDown size={16} weight="bold" aria-hidden />
          </button>
        </motion.div>
      </div>

      <motion.figure
        className="lnd-hero__media"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
      >
        <video
          src="/landing/panel-demo.mp4"
          poster="/landing/panel-board.jpg"
          width={1280}
          height={728}
          autoPlay={!reduce}
          controls={!!reduce}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={t.hero.videoLabel}
        />
      </motion.figure>
    </section>
  );
}
