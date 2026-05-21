import { AppLogo } from "../AppLogo";
import { IntegrationBrandIcon } from "../IntegrationBrandIcon";
import { useI18n } from "../../i18n";

const INTEGRATIONS = ["jira", "trello", "github", "slack"] as const;

const TAG_COLORS = ["purple", "orange", "blue", "green"] as const;

function ConnArrow({ tone }: { tone: "tg" | "out" }) {
  return <div className={`lp-hero-conn lp-hero-conn--${tone}`} aria-hidden />;
}

export function HeroFlowIllustration() {
  const { messages: t } = useI18n();
  const d = t.heroDiagram;
  const messages = d.telegram.messages.slice(0, 2);

  return (
    <div className="lp-hero-diagram" role="img" aria-label={d.aria}>
      <div className="lp-hero-diagram__flow">
        <article className="lp-hero-panel lp-hero-tg">
          <header className="lp-hero-tg__head">
            <span className="lp-hero-tg__logo" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#229ED9" />
                <path
                  d="M5.5 11.8l11.2-4.3c.5-.2 1 .1.8.9l-1.9 9c-.1.5-.4.6-.8.4l-2.2-1.6-1.1 1.1c-.1.1-.3.2-.5.2l.2-3.1 8.1-7.3c.1-.1 0-.2-.1-.1L9.6 13.5l-3.3 1.1c-.4.1-.4.4.1.5l.8.3 1.6.5 3.8 1.2c.5.2 1 .1.8-.9z"
                  fill="#fff"
                />
              </svg>
            </span>
            <strong>{d.telegram.title}</strong>
          </header>
          <ul className="lp-hero-tg__msgs">
            {messages.map((msg, i) => (
              <li key={i} className="lp-hero-tg__msg">
                <div className="lp-hero-tg__bubble">
                  <p>{msg.text}</p>
                  <time>{msg.time}</time>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <div className="lp-hero-bridge lp-hero-bridge--in">
          <ConnArrow tone="tg" />
        </div>

        <article className="lp-hero-panel lp-hero-svc">
          <header className="lp-hero-svc__head">
            <AppLogo size={36} />
            <span>
              <strong>{d.service.title}</strong>
              <small>{d.service.sub}</small>
            </span>
          </header>
          <div className="lp-hero-svc__tags">
            {d.service.tags.map((label, i) => (
              <span key={label} className={`lp-hero-svc__tag lp-hero-svc__tag--${TAG_COLORS[i]}`}>
                {label}
              </span>
            ))}
          </div>
          <div className="lp-hero-svc__kanban" aria-hidden>
            {d.service.kanbanCols.map((col, ci) => (
              <div key={col} className="lp-hero-svc__col">
                <span className="lp-hero-svc__col-label">{col}</span>
                <div
                  className={`lp-hero-svc__card${ci === d.service.kanbanCols.length - 1 ? " lp-hero-svc__card--done" : ""}`}
                />
              </div>
            ))}
          </div>
          <p className="lp-hero-svc__hint">{d.service.step3Text}</p>
        </article>

        <div className="lp-hero-route">
          {INTEGRATIONS.map((id, i) => {
            const item = d.integrations[id];
            return (
              <div key={id} className="lp-hero-route__row">
                <div className="lp-hero-bridge lp-hero-bridge--out">
                  <ConnArrow tone="out" />
                </div>
                <article
                  className={`lp-hero-panel lp-hero-out lp-hero-out--${id === "github" ? "github" : "light"}`}
                  style={{ animationDelay: `${0.2 + i * 0.06}s` }}
                >
                  <IntegrationBrandIcon provider={id} size={24} className="lp-hero-out__icon" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.sub}</small>
                  </span>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
