import { AppBrandName } from "./AppBrandName";
import { AppIcon3D } from "./AppIcon3D";

interface Props {
  size?: number;
  showText?: boolean;
  className?: string;
}

/** Логотип TaskExtraction: компактный 3D-значок (слои по глубине, наклон за курсором). Плоский исходник: public/brand/logo-mark.svg */
export function AppLogo({ size = 28, showText = false, className = "" }: Props) {
  return (
    <span className={`app-logo ${className}`.trim()}>
      <AppIcon3D size={size} compact className="app-logo-mark" />
      {showText && <AppBrandName className="app-logo-text" />}
    </span>
  );
}
