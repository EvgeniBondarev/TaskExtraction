import { ReactNode } from "react";

interface Props {
  title: string;
  lead?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}

/** Обёртка для вкладок настроек — контент по центру, единый стиль */
export function SettingsPanel({ title, lead, icon, children, className = "" }: Props) {
  return (
    <div className={`settings-panel ${className}`.trim()}>
      <header className="panel-head">
        {icon && (
          <span className="panel-icon" aria-hidden>
            {icon}
          </span>
        )}
        <div>
          <h3>{title}</h3>
          {lead && <p className="panel-lead">{lead}</p>}
        </div>
      </header>
      <div className="panel-body">{children}</div>
      <style>{`
        .settings-panel {
          max-width: 640px;
          margin: 0 auto;
          width: 100%;
        }
        .panel-head {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          margin-bottom: 1.35rem;
          padding-bottom: 1.15rem;
          border-bottom: 1px solid var(--border);
        }
        .panel-icon {
          flex-shrink: 0;
          width: 2.75rem;
          height: 2.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        .panel-head h3 {
          margin: 0 0 0.3rem;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .panel-lead {
          margin: 0;
          font-size: 0.88rem;
          color: var(--muted);
          line-height: 1.45;
          max-width: 36rem;
        }
        .panel-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .settings-panel--wide {
          max-width: 100%;
        }
        .settings-panel--integrations .panel-icon {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.3);
        }
        .settings-panel--llm .panel-icon {
          background: rgba(168, 85, 247, 0.12);
          border-color: rgba(168, 85, 247, 0.35);
        }
      `}</style>
    </div>
  );
}
