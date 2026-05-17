interface Props {
  label?: string;
}

export function LoadingDots({ label = "Загрузка" }: Props) {
  return (
    <div className="loading-dots" role="status" aria-live="polite">
      <span className="label">{label}</span>
      <span className="dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <style>{`
        .loading-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.1rem;
          padding: 2.5rem 1rem;
          color: var(--muted);
          font-size: 0.95rem;
        }
        .label { margin-right: 0.15rem; }
        .dots {
          display: inline-flex;
          align-items: flex-end;
          gap: 0.28rem;
          height: 1.1em;
          padding-bottom: 0.05rem;
        }
        .dots span {
          width: 0.4rem;
          height: 0.4rem;
          border-radius: 50%;
          background: var(--accent);
          animation: loading-dot 1.2s ease-in-out infinite;
        }
        .dots span:nth-child(2) { animation-delay: 0.15s; }
        .dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes loading-dot {
          0%, 70%, 100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          35% {
            transform: translateY(-0.4rem);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

