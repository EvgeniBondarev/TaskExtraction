import { JiraLogoIcon } from "./icons/JiraLogoIcon";
import { SlackLogoIcon } from "./icons/SlackLogoIcon";
import { TrelloLogoIcon } from "./icons/TrelloLogoIcon";

export type IntegrationProvider = "jira" | "trello" | "github" | "slack" | "youtrack";

const META: Record<
  IntegrationProvider,
  { label: string; color: string; bg: string; border: string }
> = {
  jira: {
    label: "Jira",
    color: "#2684ff",
    bg: "rgba(255, 255, 255, 0.95)",
    border: "rgba(38, 132, 255, 0.35)",
  },
  trello: {
    label: "Trello",
    color: "#0079bf",
    bg: "rgba(255, 255, 255, 0.95)",
    border: "rgba(0, 121, 191, 0.35)",
  },
  github: {
    label: "GitHub",
    color: "#e6edf3",
    bg: "rgba(230, 237, 243, 0.08)",
    border: "rgba(230, 237, 243, 0.2)",
  },
  slack: {
    label: "Slack",
    color: "#e01e5a",
    bg: "rgba(255, 255, 255, 0.95)",
    border: "rgba(224, 30, 90, 0.35)",
  },
  youtrack: {
    label: "YouTrack",
    color: "#7c5cff",
    bg: "rgba(124, 92, 255, 0.12)",
    border: "rgba(124, 92, 255, 0.35)",
  },
};

function IconSvg({ provider, size }: { provider: IntegrationProvider; size: number }) {
  if (provider === "jira") {
    return <JiraLogoIcon size={size} />;
  }
  if (provider === "trello") {
    return <TrelloLogoIcon size={size} />;
  }
  if (provider === "github") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.17-1.12-1.48-1.12-1.48-.92-.64.07-.63.07-.63 1.02.07 1.55 1.06 1.55 1.06.9 1.56 2.36 1.11 2.94.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.58.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
        />
      </svg>
    );
  }
  if (provider === "slack") {
    return <SlackLogoIcon size={size} withBackground />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 5h16v3H4V5zm0 5h10v3H4v-3zm0 5h14v3H4v-3z"
      />
    </svg>
  );
}

interface Props {
  provider: IntegrationProvider;
  size?: number;
  className?: string;
}

export function IntegrationBrandIcon({ provider, size = 22, className = "" }: Props) {
  const meta = META[provider];
  return (
    <span
      className={`integration-brand-icon ${provider} ${className}`.trim()}
      style={
        {
          "--brand-color": meta.color,
          "--brand-bg": meta.bg,
          "--brand-border": meta.border,
        } as React.CSSProperties
      }
      title={meta.label}
      aria-hidden
    >
      <IconSvg provider={provider} size={size} />
      <style>{`
        .integration-brand-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.35rem;
          height: 2.35rem;
          border-radius: 10px;
          color: var(--brand-color);
          background: var(--brand-bg);
          border: 1px solid var(--brand-border);
          flex-shrink: 0;
        }
      `}</style>
    </span>
  );
}
