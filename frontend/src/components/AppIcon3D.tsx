import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

interface Props {
  size?: number;
  className?: string;
  /** Компактный режим для логотипа в шапке: без парения и тени, с лёгким постоянным наклоном. */
  compact?: boolean;
  /** Небольшая скрытая реакция на клик по знаку приложения. */
  interactive?: boolean;
}

/**
 * Значок приложения в лёгком 3D: слои (плитка, облачко, галочка) разнесены по глубине
 * и наклоняются за курсором. При prefers-reduced-motion остаётся статичным.
 */
export function AppIcon3D({ size = 160, className = "", compact = false, interactive = true }: Props) {
  const reduce = useReducedMotion();
  const [tapKey, setTapKey] = useState(0);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const taps = useRef<number[]>([]);
  const celebrationTimer = useRef<number | null>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 150, damping: 18 });
  const sy = useSpring(py, { stiffness: 150, damping: 18 });
  // В компактном режиме значок в покое чуть развёрнут, чтобы объём читался даже в 28px.
  const restX = compact ? 10 : 0;
  const restY = compact ? -14 : 0;
  const range = compact ? 22 : 16;
  const rotateY = useTransform(sx, [-0.5, 0.5], [restY - range, restY + range]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [restX + range * 0.85, restX - range * 0.85]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(sy, [-0.5, 0.5], ["10%", "70%"]);

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  useEffect(() => () => {
    if (celebrationTimer.current !== null) window.clearTimeout(celebrationTimer.current);
  }, []);

  const onClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!interactive || reduce) return;
    // The icon can live inside a brand link/button; its small hidden interaction
    // should not navigate away before the feedback is visible.
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    taps.current = [...taps.current.filter((time) => now - time < 900), now];
    setTapKey(now);

    if (taps.current.length < 5) return;
    taps.current = [];
    setCelebrating(true);
    setCelebrationKey(now);
    if (celebrationTimer.current !== null) window.clearTimeout(celebrationTimer.current);
    celebrationTimer.current = window.setTimeout(() => setCelebrating(false), 1180);
  };

  const classes = ["te-icon3d", compact ? "te-icon3d--compact" : "", !reduce && !compact ? "is-floating" : "", celebrating ? "is-celebrating" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{ "--icon-size": `${size}px` } as React.CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      aria-hidden
    >
      <motion.span
        key={celebrating ? `celebration-${celebrationKey}` : `tap-${tapKey}`}
        className="te-icon3d__body"
        style={reduce ? (compact ? { rotateX: restX, rotateY: restY } : undefined) : { rotateX, rotateY }}
        animate={
          celebrating
            ? { scale: [1, 0.9, 1.16, 0.98, 1], rotateZ: [0, -10, 12, -6, 0], y: [0, -4, 1, 0] }
            : tapKey
              ? { scale: [1, 0.9, 1.07, 1], rotateZ: [0, -3, 2, 0] }
              : { scale: 1, rotateZ: 0, y: 0 }
        }
        transition={celebrating ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="te-icon3d__tile">
          <motion.span
            className="te-icon3d__glare"
            style={reduce ? undefined : ({ "--gx": glareX, "--gy": glareY } as unknown as React.CSSProperties)}
          />
        </span>
        <svg className="te-icon3d__bubble" viewBox="0 0 64 64" fill="none">
          <path
            d="M19 15h26a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H27.5l-8.7 7.1c-.98.8-2.45.1-2.45-1.16V42.6A6 6 0 0 1 13 37V21a6 6 0 0 1 6-6Z"
            fill="#FAFAF9"
          />
        </svg>
        <svg className="te-icon3d__check" viewBox="0 0 64 64" fill="none">
          <path d="M23.5 29.5l5.5 5.5 11.5-11.5" stroke="#EA580C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.span>
      {celebrating && (
        <span className="te-icon3d__celebration" aria-hidden>
          {Array.from({ length: 8 }).map((_, index) => <i key={index} style={{ "--burst-index": index } as React.CSSProperties} />)}
        </span>
      )}
      {!compact && <span className="te-icon3d__shadow" />}
    </span>
  );
}
