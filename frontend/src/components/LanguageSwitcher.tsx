import { useI18n, type Locale } from "../i18n";

type Props = {
  className?: string;
};

const LOCALES: { id: Locale; label: string }[] = [
  { id: "ru", label: "RU" },
  { id: "en", label: "EN" },
];

export function LanguageSwitcher({ className = "" }: Props) {
  const { locale, setLocale, messages } = useI18n();

  const pick = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div
      className={`lang-switch ${className}`.trim()}
      role="group"
      aria-label={messages.lang.label}
    >
      {LOCALES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`lang-switch-btn ${locale === id ? "is-active" : ""}`}
          onClick={() => pick(id)}
          aria-pressed={locale === id}
          aria-label={id === "ru" ? messages.lang.ru : messages.lang.en}
          title={id === "ru" ? messages.lang.ru : messages.lang.en}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
