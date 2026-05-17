import { CSSProperties, ReactNode } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: CSSProperties;
  circle?: boolean;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  radius = 8,
  className = "",
  style,
  circle,
}: SkeletonProps) {
  return (
    <span
      className={`skeleton-block ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : radius,
        ...style,
      }}
      aria-hidden
    />
  );
}

interface SkeletonGroupProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

export function SkeletonGroup({ children, className = "", label = "Загрузка" }: SkeletonGroupProps) {
  return (
    <div
      className={`skeleton-group ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {children}
      <style>{`
        .skeleton-group {
          --sk-base: rgba(45, 58, 79, 0.55);
          --sk-shine: rgba(148, 163, 184, 0.12);
        }
        .skeleton-block {
          display: block;
          background: linear-gradient(
            90deg,
            var(--sk-base) 0%,
            var(--sk-shine) 45%,
            var(--sk-base) 90%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.35s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-block {
            animation: none;
            background: var(--sk-base);
          }
        }
      `}</style>
    </div>
  );
}
