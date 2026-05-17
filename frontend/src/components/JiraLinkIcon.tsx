import { ExternalLink } from "../api";
import { IntegrationBrandIcon } from "./IntegrationBrandIcon";

interface Props {
  link: ExternalLink;
  size?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function JiraLinkIcon({ link, size = 18, className = "", onClick }: Props) {
  const label = link.external_id ? `Jira ${link.external_id}` : "Открыть в Jira";

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className={`integration-link-icon jira-link-icon ${className}`.trim()}
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <IntegrationBrandIcon provider="jira" size={size} className="in-link" />
      <style>{`
        .integration-link-icon {
          display: inline-flex;
          text-decoration: none;
          flex-shrink: 0;
          transition: transform 0.15s;
        }
        .integration-link-icon:hover { transform: scale(1.05); }
        .integration-link-icon .integration-brand-icon.in-link {
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 6px;
        }
      `}</style>
    </a>
  );
}
