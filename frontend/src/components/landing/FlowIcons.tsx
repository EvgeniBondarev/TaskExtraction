interface IconProps {
  size?: number;
  className?: string;
}

export function IconTelegram({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c.18 1.53-.96 3.42-2.14 4.66-.9.94-3.28 2.37-3.28 2.37l-.01 1.45s-.14 1.12.98.65c.56-.25 2.2-1.4 3.08-1.96 1.28-.84 4.48-2.92 5.76-3.78 1.02-.69.72-1.34-.22-1.1-4.12 1.02-9.7 2.5-9.7 2.5s-1.15.36-1.05-.36c.05-.4.78-1.62 1.68-2.74 1.16-1.44 3.9-4.74 3.9-4.74s.32-.56-.23-.36c-.4.14-2.58 1.62-6.52 4.44z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconClassification({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 6h16M4 12h10M4 18h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="19" cy="12" r="3" fill="currentColor" opacity="0.35" />
      <path d="M17.5 12l1 1 2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconKanban({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="4" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="16" y="4" width="5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function IconSync({ size = 24, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 4v3l3-3-3-3v3zm0 16v-3l-3 3 3 3v-3z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M6.5 8.5A6 6 0 0 1 17 7l1.2 1.2M17.5 15.5A6 6 0 0 1 7 17l-1.2-1.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}
