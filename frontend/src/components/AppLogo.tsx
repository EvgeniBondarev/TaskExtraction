import { AppBrandName } from "./AppBrandName";

interface Props {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function AppLogo({ size = 28, showText = false, className = "" }: Props) {
  return (
    <span className={`app-logo ${className}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="app-logo-mark"
      >
        <defs>
          <linearGradient id="te-logo-bg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#te-logo-bg)" />
        <path
          d="M9 10h10M9 14h7M9 18h9"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M21 9l3 3-6 6h-3v-3l6-6z"
          fill="#93c5fd"
          stroke="#e0f2fe"
          strokeWidth="0.5"
        />
        <circle cx="23" cy="8" r="1.5" fill="#4ade80" />
      </svg>
      {showText && <AppBrandName className="app-logo-text" />}
    </span>
  );
}
