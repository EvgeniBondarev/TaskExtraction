import { IntegrationBrandIcon, IntegrationProvider } from "./IntegrationBrandIcon";

export type IntegrationConnectionState = "off" | "idle" | "ready" | "active";

export function integrationState(opts: {
  is_configured?: boolean;
  enabled?: boolean;
  has_token?: boolean;
}): IntegrationConnectionState {
  if (!opts.is_configured && !opts.has_token) return "idle";
  if (!opts.enabled) return "ready";
  return "active";
}

const STATE_LABELS: Record<IntegrationConnectionState, string> = {
  idle: "Не настроено",
  ready: "Настроено · выкл.",
  active: "Подключено",
  off: "Скоро",
};

interface Props {
  provider: IntegrationProvider;
  title: string;
  subtitle?: string | null;
  state: IntegrationConnectionState;
  autoPush?: boolean;
  serviceUrl?: string | null;
}

export function IntegrationCardHeader({
  provider,
  title,
  subtitle,
  state,
  autoPush,
  serviceUrl,
}: Props) {
  const stateLabel =
    state === "active" && autoPush
      ? "Подключено · авто"
      : STATE_LABELS[state];

  return (
    <header className="integration-card-header">
      <IntegrationBrandIcon provider={provider} size={22} />
      <div className="integration-card-titles">
        <div className="integration-card-title-row">
          <h3>{title}</h3>
          <span className={`integration-state state-${state}`}>{stateLabel}</span>
        </div>
        {subtitle && <p className="integration-subtitle">{subtitle}</p>}
      </div>
      {serviceUrl && (
        <a
          className="integration-open"
          href={serviceUrl}
          target="_blank"
          rel="noreferrer"
          title={`Открыть ${title}`}
        >
          ↗
        </a>
      )}
      <style>{`
        .integration-card-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .integration-card-titles { flex: 1; min-width: 0; }
        .integration-card-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .integration-card-header h3 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
        }
        .integration-subtitle {
          margin: 0.2rem 0 0;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .integration-state {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.15rem 0.45rem;
          border-radius: 5px;
        }
        .integration-state.state-idle {
          color: var(--muted);
          background: rgba(148, 163, 184, 0.12);
          border: 1px solid rgba(148, 163, 184, 0.25);
        }
        .integration-state.state-ready {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.12);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .integration-state.state-active {
          color: #4ade80;
          background: rgba(74, 222, 128, 0.12);
          border: 1px solid rgba(74, 222, 128, 0.35);
        }
        .integration-state.state-off {
          color: var(--muted);
          background: rgba(148, 163, 184, 0.08);
        }
        .integration-open {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 8px;
          font-size: 1rem;
          text-decoration: none;
          color: var(--muted);
          border: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
        }
        .integration-open:hover {
          color: var(--text);
          border-color: var(--accent);
        }
      `}</style>
    </header>
  );
}
