import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

interface Props {
  size?: number;
  className?: string;
}

/**
 * Значок приложения в лёгком 3D: слои (плитка, облачко, галочка) разнесены по глубине
 * и чуть наклоняются за курсором. При prefers-reduced-motion остаётся статичным.
 */
export function AppIcon3D({ size = 160, className = "" }: Props) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 150, damping: 18 });
  const sy = useSpring(py, { stiffness: 150, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-16, 16]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [14, -14]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(sy, [-0.5, 0.5], ["10%", "70%"]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      className={`te-icon3d${reduce ? "" : " is-floating"} ${className}`.trim()}
      style={{ "--icon-size": `${size}px` } as React.CSSProperties}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-hidden
    >
      <motion.div className="te-icon3d__body" style={reduce ? undefined : { rotateX, rotateY }}>
        <div className="te-icon3d__tile">
          <motion.span
            className="te-icon3d__glare"
            style={reduce ? undefined : { "--gx": glareX, "--gy": glareY } as unknown as React.CSSProperties}
          />
        </div>
        <svg className="te-icon3d__bubble" viewBox="0 0 64 64" fill="none">
          <path
            d="M19 15h26a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H27.5l-8.7 7.1c-.98.8-2.45.1-2.45-1.16V42.6A6 6 0 0 1 13 37V21a6 6 0 0 1 6-6Z"
            fill="#FAFAF9"
          />
        </svg>
        <svg className="te-icon3d__check" viewBox="0 0 64 64" fill="none">
          <path d="M23.5 29.5l5.5 5.5 11.5-11.5" stroke="#EA580C" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <span className="te-icon3d__shadow" />
    </div>
  );
}
