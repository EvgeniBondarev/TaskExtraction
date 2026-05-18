import { APP_VERSION } from "../config/version";

interface Props {
  className?: string;
  /** Класс для серой метки версии */
  versionClassName?: string;
}

export function AppBrandName({ className = "", versionClassName = "" }: Props) {
  return (
    <span className={`app-brand-name-wrap ${className}`.trim()}>
      <span className="app-brand-title">TaskExtraction</span>
      <span className={`app-brand-version ${versionClassName}`.trim()}>v{APP_VERSION}</span>
    </span>
  );
}
