import { AppBrandName } from "./AppBrandName";

interface Props {
  size?: number;
  showText?: boolean;
  className?: string;
}

/** Знак TaskExtraction: сообщение, превращённое в выполненную задачу. Исходник: public/brand/logo-mark.svg */
export function AppLogo({ size = 28, showText = false, className = "" }: Props) {
  return (
    <span className={`app-logo ${className}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="app-logo-mark"
      >
        <rect width="64" height="64" rx="16" fill="#18181B" />
        <path
          d="M19 15h26a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H27.5l-8.7 7.1c-.98.8-2.45.1-2.45-1.16V42.6A6 6 0 0 1 13 37V21a6 6 0 0 1 6-6Z"
          fill="#FAFAF9"
        />
        <path
          d="M23.5 29.5l5.5 5.5 11.5-11.5"
          stroke="#EA580C"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && <AppBrandName className="app-logo-text" />}
    </span>
  );
}
