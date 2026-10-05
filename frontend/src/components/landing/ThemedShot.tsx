interface Props {
  name: "board" | "task" | "feed";
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

/** Скриншот панели в светлой и тёмной теме; CSS показывает нужный под текущую тему. */
export function ThemedShot({ name, alt, width, height, priority, className = "" }: Props) {
  const common = { width, height, decoding: "async" as const, loading: priority ? ("eager" as const) : ("lazy" as const) };
  return (
    <span className={`lnd-shot ${className}`.trim()}>
      <img className="lnd-shot__light" src={`/landing/${name}-light.jpg`} alt={alt} {...common} />
      <img className="lnd-shot__dark" src={`/landing/${name}-dark.jpg`} alt="" aria-hidden {...common} />
    </span>
  );
}
