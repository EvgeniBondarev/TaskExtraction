import { SlackLogo } from "@phosphor-icons/react";
import { siGithub, siJira, siTelegram, siTrello, type SimpleIcon } from "simple-icons";

export type Brand = "telegram" | "jira" | "trello" | "github" | "slack";

const ICONS: Record<Exclude<Brand, "slack">, SimpleIcon> = {
  telegram: siTelegram,
  jira: siJira,
  trello: siTrello,
  github: siGithub,
};

export const BRAND_NAMES: Record<Brand, string> = {
  telegram: "Telegram",
  jira: "Jira",
  trello: "Trello",
  github: "GitHub",
  slack: "Slack",
};

interface Props {
  brand: Brand;
  size?: number;
  className?: string;
}

/** Монохромный логотип бренда (Simple Icons; Slack из Phosphor, в Simple Icons его нет). */
export function BrandMark({ brand, size = 20, className }: Props) {
  const label = BRAND_NAMES[brand];
  if (brand === "slack") {
    return <SlackLogo size={size} weight="fill" className={className} role="img" aria-label={label} />;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label={label}
    >
      <path d={ICONS[brand].path} />
    </svg>
  );
}
