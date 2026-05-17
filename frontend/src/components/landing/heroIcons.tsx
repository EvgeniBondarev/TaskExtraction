import type { ReactNode } from "react";
import { JiraLogoIcon } from "../icons/JiraLogoIcon";
import { TrelloLogoIcon } from "../icons/TrelloLogoIcon";

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

function brandLogoTransform(boxX: number, boxY: number, boxSize: number, viewSize: number) {
  const pad = 10;
  const inner = boxSize - pad * 2;
  const scale = inner / viewSize;
  const cx = boxX + boxSize / 2;
  const cy = boxY + boxSize / 2;
  return `translate(${cx}, ${cy}) scale(${scale}) translate(${-viewSize / 2}, ${-viewSize / 2})`;
}

export function HeroIconJiraBox(props: BoxIconProps) {
  const { boxX, boxY, boxSize } = props;
  return (
    <g filter="url(#lp-shadow)">
      <rect x={boxX} y={boxY} width={boxSize} height={boxSize} rx="14" fill="#ffffff" stroke={props.ring} strokeWidth="2" />
      <g transform={brandLogoTransform(boxX, boxY, boxSize, 256)}>
        <JiraLogoIcon size={256} />
      </g>
    </g>
  );
}

export function HeroIconTrelloBox(props: BoxIconProps) {
  const { boxX, boxY, boxSize } = props;
  return (
    <g filter="url(#lp-shadow)">
      <rect x={boxX} y={boxY} width={boxSize} height={boxSize} rx="14" fill="#ffffff" stroke={props.ring} strokeWidth="2" />
      <g transform={brandLogoTransform(boxX, boxY, boxSize, 512)}>
        <TrelloLogoIcon size={512} />
      </g>
    </g>
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
  const { boxX, boxY, boxSize } = props;
  const cx = boxX + boxSize / 2;
  const cy = boxY + boxSize / 2;
  const scale = (boxSize - 16) / 512;
  return (
    <g filter="url(#lp-shadow)">
      <rect
        x={boxX}
        y={boxY}
        width={boxSize}
        height={boxSize}
        rx="14"
        fill="#ffffff"
        stroke={props.ring}
        strokeWidth="2"
      />
      <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-256, -256)`}>
        <g fill="#e01e5a">
          <path
            id="lp-slack-shape"
            d="M149 305a39 39 0 01-78 0c0-22 17-39 39-39h39zM168 305a39 39 0 0178 0v97a39 39 0 01-78 0z"
          />
        </g>
        <use href="#lp-slack-shape" fill="#36c5f0" transform="rotate(90 256 256)" />
        <use href="#lp-slack-shape" fill="#2eb67d" transform="rotate(180 256 256)" />
        <use href="#lp-slack-shape" fill="#ecb22e" transform="rotate(270 256 256)" />
      </g>
    </g>
  );
}
