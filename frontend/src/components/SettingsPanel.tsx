import { ReactNode } from "react";
import "../styles/settings-panel.css";

interface Props {
  title: string;
  lead?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}

/** Обёртка для вкладок настроек — единый стиль заголовка и тела */
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
    </div>
  );
}
