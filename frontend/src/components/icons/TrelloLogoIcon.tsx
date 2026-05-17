/** Логотип Trello — https://www.svgrepo.com/svg/349532/trello */

interface Props {
  size?: number;
  className?: string;
}

export function TrelloLogoIcon({ size = 24, className = "" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="15%" fill="#0079bf" />
      <rect x="97" y="95" width="132" height="296" rx="23" fill="#ffffff" />
      <rect x="284" y="95" width="132" height="188" rx="23" fill="#ffffff" />
    </svg>
  );
}
