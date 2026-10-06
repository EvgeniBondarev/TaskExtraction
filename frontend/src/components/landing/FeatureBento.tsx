import { ArrowBendUpLeft, SlidersHorizontal } from "@phosphor-icons/react";
import { useI18n } from "../../i18n";
import { ReplySequence } from "./ReplySequence";
import { Reveal } from "./Reveal";
import { ThemedShot } from "./ThemedShot";

export function FeatureBento() {
  const { messages } = useI18n();
  const t = messages.landing.features;
  const replies = messages.landing.playground.replies;
  const bot = messages.landing.playground.bot;

  return (
    <section className="lnd-features lnd-wrap" aria-labelledby="lnd-features-title">
      <h2 id="lnd-features-title">{t.title}</h2>
      <div className="lnd-bento">
        <Reveal className="lnd-cell lnd-cell--card">
          <div className="lnd-cell__text">
            <h3>{t.card.title}</h3>
            <p>{t.card.body}</p>
          </div>
          <ThemedShot name="task" alt={t.card.alt} width={778} height={1100} />
        </Reveal>

        <Reveal className="lnd-cell lnd-cell--replies" delay={0.05}>
          <ReplySequence bot={bot} lines={[replies.progress, replies.done]} />
          <h3>{t.replies.title}</h3>
          <p>{t.replies.body}</p>
        </Reveal>

        <Reveal className="lnd-cell lnd-cell--answer" delay={0.1}>
          <ArrowBendUpLeft size={26} aria-hidden />
          <h3>{t.answer.title}</h3>
          <p>{t.answer.body}</p>
        </Reveal>

        <Reveal className="lnd-cell lnd-cell--board" delay={0.05}>
          <ThemedShot name="feed" alt={t.board.alt} width={1280} height={1093} />
          <div className="lnd-cell__text">
            <h3>{t.board.title}</h3>
            <p>{t.board.body}</p>
          </div>
        </Reveal>

        <Reveal className="lnd-cell lnd-cell--prompt">
          <SlidersHorizontal size={26} aria-hidden />
          <div>
            <h3>{t.prompt.title}</h3>
            <p>{t.prompt.body}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
