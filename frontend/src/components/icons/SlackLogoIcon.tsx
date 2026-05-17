/** Логотип Slack — https://www.svgrepo.com/svg/349509/slack */

const SHAPE =
  "M149 305a39 39 0 01-78 0c0-22 17-39 39-39h39zM168 305a39 39 0 0178 0v97a39 39 0 01-78 0z";

interface Props {
  size?: number;
  className?: string;
  withBackground?: boolean;
}

export function SlackLogoIcon({ size = 24, className = "", withBackground = true }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden>
      {withBackground && <rect width="512" height="512" rx="15%" fill="#ffffff" />}
      <g fill="#e01e5a">
        <path d={SHAPE} />
      </g>
      <g fill="#36c5f0" transform="rotate(90 256 256)">
        <path d={SHAPE} />
      </g>
      <g fill="#2eb67d" transform="rotate(180 256 256)">
        <path d={SHAPE} />
      </g>
      <g fill="#ecb22e" transform="rotate(270 256 256)">
        <path d={SHAPE} />
      </g>
    </svg>
  );
}
