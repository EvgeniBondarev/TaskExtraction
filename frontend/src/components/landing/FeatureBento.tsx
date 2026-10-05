import { ArrowBendUpLeft, SlidersHorizontal } from "@phosphor-icons/react";
import { useI18n } from "../../i18n";
import { Reveal } from "./Reveal";

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
          <img src="/landing/panel-task.jpg" alt={t.card.alt} width={720} height={871} loading="lazy" />
        </Reveal>

        <Reveal className="lnd-cell lnd-cell--replies" delay={0.05}>
          <div className="lnd-replies" aria-hidden>
            <span className="lnd-replies__bubble">
              <small>{bot}</small>
              {replies.progress}
            </span>
            <span className="lnd-replies__bubble">
              <small>{bot}</small>
              {replies.done}
            </span>
          </div>
          <h3>{t.replies.title}</h3>
          <p>{t.replies.body}</p>
        </Reveal>

        <Reveal className="lnd-cell lnd-cell--answer" delay={0.1}>
          <ArrowBendUpLeft size={26} aria-hidden />
          <h3>{t.answer.title}</h3>
          <p>{t.answer.body}</p>
        </Reveal>

        <Reveal className="lnd-cell lnd-cell--board" delay={0.05}>
          <img src="/landing/panel-cards.jpg" alt={t.board.alt} width={1100} height={797} loading="lazy" />
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
