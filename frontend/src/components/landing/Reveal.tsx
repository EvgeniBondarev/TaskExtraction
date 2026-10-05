import { motion } from "motion/react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
  id?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Появление блока при входе во вьюпорт. При prefers-reduced-motion MotionConfig отключает сдвиг. */
export function Reveal({ children, className, delay = 0, as = "div", id }: Props) {
  const Tag = motion[as];
  return (
    <Tag
      id={id}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}
