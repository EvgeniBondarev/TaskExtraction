export type IntegrationProvider = "jira" | "trello" | "github" | "slack" | "youtrack";

const META: Record<
  IntegrationProvider,
  { label: string; color: string; bg: string; border: string }
> = {
  jira: {
    label: "Jira",
    color: "#2684ff",
    bg: "rgba(38, 132, 255, 0.12)",
    border: "rgba(38, 132, 255, 0.35)",
  },
  trello: {
    label: "Trello",
    color: "#0079bf",
    bg: "rgba(0, 121, 191, 0.12)",
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
    bg: "rgba(224, 30, 90, 0.12)",
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
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M11.57 11.51H0a5.22 5.22 0 0 0 5.23 5.22h2.13v2.05A5.22 5.22 0 0 0 12.57 23.8V12.52a1 1 0 0 0-1-1.01zm5.72-5.76H5.82a5.22 5.22 0 0 0 5.22 5.21h2.13v2.06a5.22 5.22 0 0 0 5.22 5.21V6.76a1 1 0 0 0-1-1.01zM23.01 0H11.46a5.22 5.22 0 0 0 5.22 5.22v2.12h2.13a5.22 5.22 0 0 0 5.21 5.22V1a1 1 0 0 0-1-1z"
        />
      </svg>
    );
  }
  if (provider === "trello") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <rect x="2" y="4" width="9" height="14" rx="2" fill="currentColor" opacity="0.95" />
        <rect x="13" y="4" width="9" height="7" rx="2" fill="currentColor" opacity="0.75" />
        <rect x="13" y="13" width="9" height="5" rx="2" fill="currentColor" opacity="0.55" />
      </svg>
    );
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
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M5.04 15.31a2.17 2.17 0 0 1-2.16-2.17v-2.16a2.17 2.17 0 0 1 2.16-2.16h2.16v2.16a2.17 2.17 0 0 1-2.16 2.16H5.04zm2.16-8.65a2.17 2.17 0 0 1-2.16-2.16V2.34a2.17 2.17 0 0 1 2.16-2.16h2.16v2.16a2.17 2.17 0 0 1-2.16 2.16H7.2zm8.65 2.16a2.17 2.17 0 0 1 2.16-2.16h2.16v2.16a2.17 2.17 0 0 1-2.16 2.16h-2.16V8.82zm-2.16 8.65a2.17 2.17 0 0 1 2.16 2.16v2.16a2.17 2.17 0 0 1-2.16 2.16h-2.16v-2.16a2.17 2.17 0 0 1 2.16-2.16h2.16z"
        />
      </svg>
    );
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
