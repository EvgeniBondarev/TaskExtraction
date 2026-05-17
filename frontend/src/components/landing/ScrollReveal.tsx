import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealDirection = "up" | "down" | "left" | "right" | "scale";

interface Props {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  direction?: RevealDirection;
  /** Запустить анимацию сразу (hero) */
  immediate?: boolean;
  as?: ElementType;
}

export function ScrollReveal({
  children,
  className = "",
  id,
  delay = 0,
  direction = "up",
  immediate = false,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  const style = { "--lp-reveal-delay": `${delay}ms` } as CSSProperties;

  return (
    <Tag
      id={id}
      ref={ref as never}
      className={`lp-reveal lp-reveal--${direction}${visible ? " lp-reveal--in" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
