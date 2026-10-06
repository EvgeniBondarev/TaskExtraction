import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useI18n } from "../i18n";
import { ThemePref, useThemePref } from "../utils/theme";

const OPTIONS: { id: ThemePref; icon: typeof Sun }[] = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Desktop },
];

/** Переключатель темы: светлая, тёмная, как в системе. */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { messages } = useI18n();
  const t = messages.panel.theme;
  const [pref, setPref] = useThemePref();

  return (
    <div className={`te-theme-switch ${className}`.trim()} role="radiogroup" aria-label={t.label}>
      {OPTIONS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={pref === id}
          className={pref === id ? "is-active" : ""}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setPref(id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }}
          title={t[id]}
          aria-label={t[id]}
        >
          <Icon size={15} weight={pref === id ? "fill" : "regular"} />
        </button>
      ))}
    </div>
  );
}
