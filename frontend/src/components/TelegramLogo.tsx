interface Props {
  size?: number;
  className?: string;
}

/** Официальный стиль логотипа Telegram: круг #229ED9 + белый самолётик */
export function TelegramLogo({ size = 48, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="24" cy="24" r="24" fill="#229ED9" />
      <path
        d="M10.5 23.4L33.2 14.2c.9-.35 1.7.15 1.4 1.35l-3.4 16.2c-.25 1.15-1 .95-1.65.6l-4.6-3.4-2.2 2.1c-.25.25-.65.4-1 .4l.35-5.2 14.5-13.1c.15-.15 0-.25-.15-.2L17.8 26.4l-5.9 2c-.7.25-.7.7.15.85l1.45.55 2.85.9 6.8 2.15c.85.35 1.7.15 1.35-1.35z"
        fill="#fff"
      />
    </svg>
  );
}
