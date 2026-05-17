/** Декоративные SVG-мокапы для промо-слайдов. */

import {
  HeroAppLogoMark,
  HeroIconGitHubBox,
  HeroIconJiraBox,
  HeroIconSlackBox,
  HeroIconTrelloBox,
} from "./heroIcons";

/** Координаты разнесённой схемы (viewBox 720×400) */
const PHONE = { x: 16, y: 28, w: 132, h: 344 };
const LOGO = { cx: 210, cy: 200, size: 84 };
const PANEL = { x: 278, y: 24, w: 210, h: 352 };
const INT_COL = 548;
const INT_SIZE = 64;

const INTEGRATIONS = [
  { Icon: HeroIconJiraBox, y: 32, ring: "#2684FF" },
  { Icon: HeroIconTrelloBox, y: 112, ring: "#0079BF" },
  { Icon: HeroIconGitHubBox, y: 192, ring: "#e6edf3" },
  { Icon: HeroIconSlackBox, y: 272, ring: "#E01E5A" },
] as const;

function hubEdge() {
  const h = LOGO.size / 2;
  return {
    left: LOGO.cx - h,
    right: LOGO.cx + h,
    top: LOGO.cy - h,
    bottom: LOGO.cy + h,
  };
}

/** Hero: Telegram → сервис → панель → иконки интеграций (разнесённая схема) */
export function HeroIllustration() {
  const hub = hubEdge();
  const phoneRight = PHONE.x + PHONE.w;
  const panelLeft = PANEL.x;

  return (
    <svg
      className="lp-illus lp-illus--hero"
      viewBox="0 0 720 400"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="lp-hero-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="lp-flow-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.85" />
        </linearGradient>
        <filter id="lp-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <marker id="lp-arrow-tg" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#229ED9" />
        </marker>
        <marker id="lp-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#3b82f6" />
        </marker>
        <marker id="lp-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="#22c55e" />
        </marker>
      </defs>

      <ellipse cx="340" cy="200" rx="300" ry="175" fill="url(#lp-hero-glow)" />

      {/* Потоки к интеграциям — дуги вокруг панели */}
      {INTEGRATIONS.map(({ y }, i) => {
        const ty = y + INT_SIZE / 2;
        const tx = INT_COL;
        return (
          <path
            key={i}
            d={`M ${hub.right} ${LOGO.cy} C ${hub.right + 55} ${LOGO.cy}, ${tx - 70} ${ty}, ${tx - 6} ${ty}`}
            stroke="url(#lp-flow-line)"
            strokeWidth="2.5"
            strokeDasharray="7 6"
            fill="none"
            opacity="0.9"
            className="lp-hero-flow-out"
            markerEnd="url(#lp-arrow-green)"
          />
        );
      })}

      {/* Telegram → хаб */}
      <path
        d={`M ${phoneRight} ${LOGO.cy} L ${hub.left} ${LOGO.cy}`}
        stroke="#229ED9"
        strokeWidth="3"
        strokeDasharray="7 5"
        fill="none"
        className="lp-hero-flow-in"
        markerEnd="url(#lp-arrow-tg)"
      />

      {/* Хаб → панель */}
      <path
        d={`M ${hub.right} ${LOGO.cy} L ${panelLeft} ${LOGO.cy}`}
        stroke="#3b82f6"
        strokeWidth="3"
        strokeDasharray="7 5"
        fill="none"
        className="lp-hero-flow-in"
        markerEnd="url(#lp-arrow-blue)"
      />

      {/* Telegram */}
      <g filter="url(#lp-shadow)">
        <rect
          x={PHONE.x}
          y={PHONE.y}
          width={PHONE.w}
          height={PHONE.h}
          rx="24"
          fill="#1a2332"
          stroke="#229ED9"
          strokeWidth="2"
        />
        <rect x={PHONE.x + 14} y={PHONE.y + 22} width={PHONE.w - 28} height="22" rx="7" fill="#2d3a4f" />
        <circle cx={PHONE.x + 28} cy={PHONE.y + 72} r="14" fill="#229ED9" opacity="0.8" />
        <rect x={PHONE.x + 48} y={PHONE.y + 66} width="72" height="8" rx="4" fill="#e7ecf3" opacity="0.85" />
        <rect x={PHONE.x + 48} y={PHONE.y + 78} width="48" height="6" rx="3" fill="#8b9cb3" />
        <rect
          x={PHONE.x + 14}
          y={PHONE.y + 98}
          width={PHONE.w - 28}
          height="48"
          rx="10"
          fill="#0f1419"
          stroke="#22c55e"
          strokeWidth="1.5"
        />
        <path
          d={`M ${PHONE.x + 26} ${PHONE.y + 114} l3.5 3.5 7-9`}
          stroke="#4ade80"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x={PHONE.x + 42} y={PHONE.y + 110} width="78" height="7" rx="3.5" fill="#e7ecf3" opacity="0.9" />
        <rect x={PHONE.x + 42} y={PHONE.y + 122} width="52" height="5" rx="2.5" fill="#8b9cb3" />
        <circle cx={PHONE.x + 28} cy={PHONE.y + 168} r="12" fill="#6366f1" opacity="0.5" />
        <rect x={PHONE.x + 48} y={PHONE.y + 162} width="64" height="6" rx="3" fill="#8b9cb3" opacity="0.6" />
      </g>

      {/* Логотип TaskExtraction */}
      <HeroAppLogoMark cx={LOGO.cx} cy={LOGO.cy} size={LOGO.size} />

      {/* Панель */}
      <g filter="url(#lp-shadow)">
        <rect
          x={PANEL.x}
          y={PANEL.y}
          width={PANEL.w}
          height={PANEL.h}
          rx="18"
          fill="#1e293b"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        <rect x={PANEL.x + 14} y={PANEL.y + 18} width="52" height="7" rx="3.5" fill="#3b82f6" opacity="0.55" />
        <rect x={PANEL.x + 14} y={PANEL.y + 32} width={PANEL.w - 28} height="10" rx="4" fill="#e7ecf3" opacity="0.85" />
        <rect x={PANEL.x + 14} y={PANEL.y + 50} width={PANEL.w - 60} height="7" rx="3.5" fill="#8b9cb3" />
        <rect x={PANEL.x + 14} y={PANEL.y + 72} width="58" height="20" rx="6" fill="#6366f1" opacity="0.35" />
        <rect x={PANEL.x + 78} y={PANEL.y + 72} width="58" height="20" rx="6" fill="#f59e0b" opacity="0.35" />
        <rect x={PANEL.x + 142} y={PANEL.y + 72} width="58" height="20" rx="6" fill="#22c55e" opacity="0.35" />
        <rect
          x={PANEL.x + 14}
          y={PANEL.y + 104}
          width={PANEL.w - 28}
          height="40"
          rx="9"
          fill="#0f1419"
          stroke="#2d3a4f"
        />
        <rect x={PANEL.x + 24} y={PANEL.y + 116} width="100" height="7" rx="3.5" fill="#e7ecf3" />
        <rect
          x={PANEL.x + 14}
          y={PANEL.y + 156}
          width={PANEL.w - 28}
          height="40"
          rx="9"
          fill="#0f1419"
          stroke="#22c55e"
          strokeWidth="1"
        />
        <rect x={PANEL.x + 24} y={PANEL.y + 168} width="80" height="7" rx="3.5" fill="#e7ecf3" />
      </g>

      {/* Интеграции */}
      {INTEGRATIONS.map(({ Icon, y, ring }, i) => (
        <Icon key={i} boxX={INT_COL} boxY={y} boxSize={INT_SIZE} ring={ring} />
      ))}
    </svg>
  );
}

export function KanbanIllustration() {
  const cardX = 56;
  const cardW = 368;
  const cards = [
    { y: 32, color: "#6366f1", label: "Inbox" },
    { y: 108, color: "#f59e0b", label: "В работе" },
    { y: 184, color: "#22c55e", label: "Готово" },
  ];
  return (
    <svg className="lp-illus" viewBox="0 0 480 320" fill="none" aria-hidden>
      <rect x="40" y="16" width="400" height="288" rx="20" fill="#1a2332" stroke="#2d3a4f" strokeWidth="2" />
      {cards.map((c, i) => (
        <g key={i}>
          <rect x={cardX} y={c.y} width={cardW} height="56" rx="12" fill="#0f1419" stroke="#2d3a4f" />
          <rect x={cardX + 16} y={c.y + 14} width="200" height="8" rx="4" fill="#e7ecf3" opacity="0.85" />
          <rect x={cardX + 16} y={c.y + 30} width="140" height="6" rx="3" fill="#8b9cb3" />
          <rect
            x={cardX + cardW - 88}
            y={c.y + 18}
            width="72"
            height="22"
            rx="8"
            fill={`${c.color}22`}
            stroke={c.color}
            strokeWidth="1"
          />
          <text
            x={cardX + cardW - 52}
            y={c.y + 33}
            textAnchor="middle"
            fill={c.color}
            fontSize="9"
            fontFamily="system-ui"
            fontWeight="600"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ShopChatIllustration() {
  return (
    <svg className="lp-illus" viewBox="0 0 480 300" fill="none" aria-hidden>
      <rect x="40" y="20" width="400" height="260" rx="20" fill="#1a2332" stroke="#229ED9" strokeWidth="2" />
      <rect x="56" y="40" width="100" height="20" rx="6" fill="rgba(34,158,217,0.2)" />
      <circle cx="72" cy="88" r="12" fill="#64748b" />
      <rect x="92" y="82" width="120" height="7" rx="3.5" fill="#8b9cb3" />
      <circle cx="400" cy="130" r="12" fill="#229ED9" opacity="0.9" />
      <rect
        x="180"
        y={108}
        width={236}
        height={64}
        rx="12"
        fill="rgba(34,158,217,0.12)"
        stroke="#229ED9"
        strokeWidth="1.5"
      />
      <text x="198" y="132" fill="#e7ecf3" fontSize="10" fontFamily="system-ui" opacity="0.95">
        Заказ №4821 не пришёл,
      </text>
      <text x="198" y="148" fill="#8b9cb3" fontSize="9" fontFamily="system-ui">
        проверьте статус доставки
      </text>
      <rect x="56" y="188" width="88" height="22" rx="8" fill="rgba(34,197,94,0.15)" stroke="#22c55e" />
      <text x="68" y="203" fill="#4ade80" fontSize="9" fontFamily="system-ui" fontWeight="600">
        → задача
      </text>
    </svg>
  );
}

export function FeedIllustration() {
  return (
    <svg className="lp-illus" viewBox="0 0 480 320" fill="none" aria-hidden>
      <rect x="40" y="20" width="400" height="280" rx="20" fill="#1a2332" stroke="#2d3a4f" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="72" cy={108 + i * 72} r="16" fill="#3b82f6" opacity={0.5 + i * 0.1} />
          <rect x="108" y={94 + i * 72} width="200" height="10" rx="4" fill="#e7ecf3" opacity="0.85" />
          <rect x="108" y={110 + i * 72} width="160" height="8" rx="4" fill="#8b9cb3" />
          <rect
            x="320"
            y={100 + i * 72}
            width="88"
            height="24"
            rx="8"
            fill={i === 0 ? "rgba(34,197,94,0.2)" : i === 1 ? "rgba(245,158,11,0.2)" : "rgba(100,116,139,0.2)"}
            stroke={i === 0 ? "#22c55e" : i === 1 ? "#f59e0b" : "#64748b"}
          />
        </g>
      ))}
    </svg>
  );
}

export function RealtimeIllustration() {
  return (
    <svg className="lp-illus" viewBox="0 0 480 280" fill="none" aria-hidden>
      <rect x="60" y="40" width="360" height="200" rx="18" fill="#1a2332" stroke="#2d3a4f" />
      <rect x="280" y="56" width="128" height="72" rx="12" fill="#0f1419" stroke="#3b82f6" strokeWidth="1.5" />
      <circle cx="296" cy="76" r="8" fill="#3b82f6" />
      <rect x="312" y="70" width="48" height="5" rx="2.5" fill="#8b9cb3" />
      <rect x="80" y="100" width="180" height="100" rx="12" fill="#0f1419" stroke="#2d3a4f" />
      <path d="M260 92 L280 72" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}
