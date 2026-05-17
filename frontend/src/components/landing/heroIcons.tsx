import type { ReactNode } from "react";

/** Встроенные SVG-иконки для hero (без текста). */

type BoxIconProps = { boxX: number; boxY: number; boxSize: number; ring: string };

function iconTransform(boxX: number, boxY: number, boxSize: number) {
  const pad = 9;
  const inner = boxSize - pad * 2;
  const scale = inner / 24;
  const cx = boxX + boxSize / 2;
  const cy = boxY + boxSize / 2;
  return `translate(${cx}, ${cy}) scale(${scale}) translate(-12, -12)`;
}

function IconBox({ boxX, boxY, boxSize, ring, children }: BoxIconProps & { children: ReactNode }) {
  return (
    <g filter="url(#lp-shadow)">
      <rect
        x={boxX}
        y={boxY}
        width={boxSize}
        height={boxSize}
        rx="14"
        fill="#1a2332"
        stroke={ring}
        strokeWidth="2"
      />
      <g transform={iconTransform(boxX, boxY, boxSize)}>{children}</g>
    </g>
  );
}

export function HeroAppLogoMark({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const x = cx - size / 2;
  const y = cy - size / 2;
  const scale = size / 32;
  return (
    <g filter="url(#lp-shadow)">
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <defs>
          <linearGradient id="lp-te-logo-bg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#lp-te-logo-bg)" />
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
      </g>
    </g>
  );
}

export function HeroIconJiraBox(props: BoxIconProps) {
  return (
    <IconBox {...props}>
      <path
        fill="#2684FF"
        d="M11.57 11.51H0a5.22 5.22 0 0 0 5.23 5.22h2.13v2.05A5.22 5.22 0 0 0 12.57 23.8V12.52a1 1 0 0 0-1-1.01zm5.72-5.76H5.82a5.22 5.22 0 0 0 5.22 5.21h2.13v2.06a5.22 5.22 0 0 0 5.22 5.21V6.76a1 1 0 0 0-1-1.01zM23.01 0H11.46a5.22 5.22 0 0 0 5.22 5.22v2.12h2.13a5.22 5.22 0 0 0 5.21 5.22V1a1 1 0 0 0-1-1z"
      />
    </IconBox>
  );
}

export function HeroIconTrelloBox(props: BoxIconProps) {
  return (
    <IconBox {...props}>
      <rect x="2" y="4" width="9" height="14" rx="2" fill="#0079BF" opacity="0.95" />
      <rect x="13" y="4" width="9" height="7" rx="2" fill="#0079BF" opacity="0.75" />
      <rect x="13" y="13" width="9" height="5" rx="2" fill="#0079BF" opacity="0.55" />
    </IconBox>
  );
}

export function HeroIconGitHubBox(props: BoxIconProps) {
  return (
    <IconBox {...props}>
      <path
        fill="#e6edf3"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.17-1.12-1.48-1.12-1.48-.92-.64.07-.63.07-.63 1.02.07 1.55 1.06 1.55 1.06.9 1.56 2.36 1.11 2.94.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.58.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
      />
    </IconBox>
  );
}

export function HeroIconSlackBox(props: BoxIconProps) {
  return (
    <IconBox {...props}>
      <path
        fill="#E01E5A"
        d="M5.04 15.31a2.17 2.17 0 0 1-2.16-2.17v-2.16a2.17 2.17 0 0 1 2.16-2.16h2.16v2.16a2.17 2.17 0 0 1-2.16 2.16H5.04zm2.16-8.65a2.17 2.17 0 0 1-2.16-2.16V2.34a2.17 2.17 0 0 1 2.16-2.16h2.16v2.16a2.17 2.17 0 0 1-2.16 2.16H7.2zm8.65 2.16a2.17 2.17 0 0 1 2.16-2.16h2.16v2.16a2.17 2.17 0 0 1-2.16 2.16h-2.16V8.82zm-2.16 8.65a2.17 2.17 0 0 1 2.16 2.16v2.16a2.17 2.17 0 0 1-2.16 2.16h-2.16v-2.16a2.17 2.17 0 0 1 2.16-2.16h2.16z"
      />
    </IconBox>
  );
}
