/** Декоративные иллюстрации для промо-слайдов. */

export { HeroFlowIllustration as HeroIllustration } from "./HeroFlowIllustration";

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
