/** Декоративные SVG-мокапы для промо-слайдов (стиль Telegram Updates). */

export function HeroIllustration() {
  return (
    <svg className="lp-illus lp-illus--hero" viewBox="0 0 520 400" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lp-hero-glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.15" />
        </linearGradient>
        <filter id="lp-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>
      <ellipse cx="260" cy="200" rx="220" ry="160" fill="url(#lp-hero-glow)" />
      <g filter="url(#lp-shadow)">
        <rect x="72" y="48" width="200" height="304" rx="28" fill="#1a2332" stroke="#2d3a4f" strokeWidth="2" />
        <rect x="88" y="72" width="168" height="28" rx="8" fill="#2d3a4f" />
        <circle cx="104" cy="128" r="18" fill="#3b82f6" opacity="0.8" />
        <rect x="130" y="118" width="110" height="10" rx="4" fill="#e7ecf3" opacity="0.9" />
        <rect x="130" y="134" width="72" height="8" rx="4" fill="#8b9cb3" />
        <rect x="88" y="162" width="168" height="56" rx="12" fill="#0f1419" stroke="#22c55e" strokeWidth="1.5" />
        <text x="102" y="188" fill="#4ade80" fontSize="11" fontFamily="system-ui" fontWeight="600">
          ✓ Задача извлечена
        </text>
        <rect x="102" y="196" width="140" height="8" rx="4" fill="#8b9cb3" opacity="0.7" />
        <circle cx="104" cy="248" r="18" fill="#6366f1" opacity="0.7" />
        <rect x="130" y="238" width="96" height="8" rx="4" fill="#8b9cb3" />
        <rect x="130" y="252" width="120" height="8" rx="4" fill="#8b9cb3" opacity="0.5" />
      </g>
      <g filter="url(#lp-shadow)">
        <rect x="248" y="88" width="200" height="240" rx="20" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
        <rect x="264" y="108" width="56" height="8" rx="4" fill="#3b82f6" opacity="0.6" />
        <rect x="264" y="124" width="168" height="12" rx="4" fill="#e7ecf3" opacity="0.85" />
        <rect x="264" y="148" width="120" height="8" rx="4" fill="#8b9cb3" />
        <rect x="264" y="176" width="72" height="22" rx="6" fill="#6366f1" opacity="0.35" />
        <rect x="344" y="176" width="72" height="22" rx="6" fill="#f59e0b" opacity="0.35" />
        <rect x="424" y="176" width="8" height="22" rx="4" fill="#22c55e" opacity="0.35" />
        <rect x="264" y="212" width="168" height="44" rx="10" fill="#0f1419" stroke="#2d3a4f" />
        <rect x="276" y="224" width="100" height="8" rx="4" fill="#e7ecf3" />
        <rect x="276" y="238" width="72" height="6" rx="3" fill="#8b9cb3" />
        <rect x="264" y="268" width="168" height="44" rx="10" fill="#0f1419" stroke="#22c55e" strokeWidth="1" />
        <rect x="276" y="280" width="88" height="8" rx="4" fill="#e7ecf3" />
      </g>
      <path
        d="M272 200 Q300 180 328 200"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        opacity="0.8"
      />
      <circle cx="272" cy="200" r="6" fill="#3b82f6" />
      <circle cx="328" cy="200" r="6" fill="#22c55e" />
    </svg>
  );
}

export function KanbanIllustration() {
  return (
    <svg className="lp-illus" viewBox="0 0 480 320" fill="none" aria-hidden>
      {[
        { x: 24, label: "Inbox", color: "#6366f1", cards: 2 },
        { x: 132, label: "В работе", color: "#f59e0b", cards: 1 },
        { x: 240, label: "Готово", color: "#22c55e", cards: 2 },
        { x: 348, label: "Архив", color: "#64748b", cards: 1 },
      ].map((col) => (
        <g key={col.label}>
          <rect x={col.x} y="24" width="108" height="272" rx="14" fill="#1a2332" stroke="#2d3a4f" />
          <circle cx={col.x + 20} cy="48" r="5" fill={col.color} />
          <text x={col.x + 32} y="52" fill="#8b9cb3" fontSize="11" fontFamily="system-ui">
            {col.label}
          </text>
          {Array.from({ length: col.cards }).map((_, i) => (
            <rect
              key={i}
              x={col.x + 12}
              y={72 + i * 78}
              width="84"
              height="64"
              rx="10"
              fill="#0f1419"
              stroke={i === 0 && col.label === "Готово" ? "#22c55e" : "#2d3a4f"}
              strokeWidth={i === 0 && col.label === "Готово" ? 1.5 : 1}
            />
          ))}
        </g>
      ))}
      <rect x="36" y="84" width="60" height="6" rx="3" fill="#e7ecf3" opacity="0.8" />
      <rect x="36" y="96" width="44" height="5" rx="2.5" fill="#8b9cb3" />
      <rect x="144" y="84" width="56" height="6" rx="3" fill="#e7ecf3" opacity="0.8" />
      <rect x="252" y="84" width="52" height="6" rx="3" fill="#4ade80" />
    </svg>
  );
}

export function FeedIllustration() {
  return (
    <svg className="lp-illus" viewBox="0 0 480 320" fill="none" aria-hidden>
      <rect x="40" y="20" width="400" height="280" rx="20" fill="#1a2332" stroke="#2d3a4f" strokeWidth="2" />
      <rect x="56" y="44" width="120" height="28" rx="8" fill="#3b82f6" opacity="0.25" />
      <text x="72" y="62" fill="#93c5fd" fontSize="12" fontFamily="system-ui" fontWeight="600">
        Лента сообщений
      </text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="76" cy={108 + i * 72} r="20" fill={i === 0 ? "#3b82f6" : "#6366f1"} opacity="0.7" />
          <rect x="108" y={94 + i * 72} width="200" height="10" rx="4" fill="#e7ecf3" opacity="0.85" />
          <rect x="108" y={110 + i * 72} width="160" height="8" rx="4" fill="#8b9cb3" />
          <rect
            x="320"
            y={98 + i * 72}
            width="88"
            height="24"
            rx="8"
            fill={i === 0 ? "rgba(34,197,94,0.2)" : i === 1 ? "rgba(245,158,11,0.2)" : "rgba(100,116,139,0.2)"}
            stroke={i === 0 ? "#22c55e" : i === 1 ? "#f59e0b" : "#64748b"}
          />
          <text
            x="332"
            y={114 + i * 72}
            fill={i === 0 ? "#4ade80" : i === 1 ? "#fbbf24" : "#94a3b8"}
            fontSize="10"
            fontFamily="system-ui"
          >
            {i === 0 ? "Задача" : i === 1 ? "Вопрос" : "Шум"}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function IntegrationsIllustration() {
  return (
    <svg className="lp-illus" viewBox="0 0 480 280" fill="none" aria-hidden>
      <circle cx="240" cy="140" r="56" fill="#1a2332" stroke="#3b82f6" strokeWidth="2" />
      <text x="240" y="146" textAnchor="middle" fill="#e7ecf3" fontSize="13" fontFamily="system-ui" fontWeight="600">
        AI
      </text>
      {[
        { cx: 80, cy: 60, label: "Jira", color: "#2684FF" },
        { cx: 400, cy: 60, label: "Trello", color: "#0079BF" },
        { cx: 80, cy: 220, label: "GitHub", color: "#e7ecf3" },
        { cx: 400, cy: 220, label: "Slack", color: "#E01E5A" },
      ].map((n) => (
        <g key={n.label}>
          <line x1="240" y1="140" x2={n.cx} y2={n.cy} stroke="#2d3a4f" strokeWidth="2" strokeDasharray="4 4" />
          <rect x={n.cx - 44} y={n.cy - 28} width="88" height="56" rx="14" fill="#1a2332" stroke={n.color} strokeWidth="1.5" />
          <text x={n.cx} y={n.cy + 5} textAnchor="middle" fill={n.color} fontSize="12" fontFamily="system-ui" fontWeight="600">
            {n.label}
          </text>
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
      <rect x="312" y="70" width="72" height="6" rx="3" fill="#e7ecf3" />
      <rect x="312" y="82" width="48" height="5" rx="2.5" fill="#8b9cb3" />
      <text x="296" y="108" fill="#4ade80" fontSize="10" fontFamily="system-ui">
        Новая задача →
      </text>
      <rect x="80" y="100" width="180" height="100" rx="12" fill="#0f1419" stroke="#2d3a4f" />
      <rect x="96" y="120" width="100" height="8" rx="4" fill="#8b9cb3" />
      <rect x="96" y="140" width="140" height="8" rx="4" fill="#e7ecf3" opacity="0.7" />
      <rect x="96" y="160" width="80" height="24" rx="8" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" />
    </svg>
  );
}
