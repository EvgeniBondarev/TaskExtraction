import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PHONE_COUNTRIES, PhoneCountry } from "../../utils/phoneCountries";
import {
  buildE164,
  formatNationalDisplay,
  normalizePhoneE164,
  parsePhoneE164,
} from "../../utils/phoneFormat";

interface Props {
  value: string;
  onChange: (e164: string) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}

export function PhoneInput({
  value,
  onChange,
  disabled,
  id: idProp,
  label = "Номер телефона",
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-countries`;
  const parsed = useMemo(() => parsePhoneE164(value), [value]);

  const [country, setCountry] = useState<PhoneCountry>(parsed.country);
  const [national, setNational] = useState(parsed.national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parsePhoneE164(value);
    setCountry(p.country);
    setNational(p.national);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.nameRu.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/\D/g, "")) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [query]);

  const maxNational = Math.max(...country.nationalLengths);
  const displayNational = formatNationalDisplay(national, country);
  const complete = country.nationalLengths.includes(national.length);

  const pickCountry = (c: PhoneCountry) => {
    setCountry(c);
    setOpen(false);
    setQuery("");
    const next = buildE164(c, national);
    onChange(next);
  };

  const onNationalChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, maxNational);
    setNational(digits);
    onChange(buildE164(country, digits));
  };

  const onPasteFull = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    const normalized = normalizePhoneE164(pasted, country);
    if (normalized.length > 2) {
      e.preventDefault();
      const p = parsePhoneE164(normalized);
      setCountry(p.country);
      setNational(p.national);
      onChange(normalized);
    }
  };

  return (
    <div className="te-phone-field" ref={wrapRef}>
      <label htmlFor={id} className="te-phone-field__label">
        {label}
      </label>
      <div
        className={`te-phone-field__shell${disabled ? " te-phone-field__shell--disabled" : ""}${complete ? " te-phone-field__shell--valid" : ""}`}
      >
        <button
          type="button"
          className="te-phone-field__country"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
        >
          <span className="te-phone-field__flag" aria-hidden>
            {country.flag}
          </span>
          <span className="te-phone-field__dial">+{country.dial}</span>
          <svg className="te-phone-field__chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        <span className="te-phone-field__sep" aria-hidden />

        <input
          id={id}
          type="tel"
          className="te-phone-field__national"
          value={displayNational}
          onChange={(e) => onNationalChange(e.target.value)}
          onPaste={onPasteFull}
          placeholder={country.iso === "BY" ? "29 978 55 92" : "999 123 45 67"}
          disabled={disabled}
          autoComplete="tel-national"
          inputMode="numeric"
        />

        {open && (
          <div className="te-phone-field__dropdown" id={listId} role="listbox">
            <input
              type="search"
              className="te-phone-field__search"
              placeholder="Страна или код…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <ul className="te-phone-field__list">
              {filtered.map((c) => (
                <li key={c.iso}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.iso === country.iso}
                    className={c.iso === country.iso ? "active" : ""}
                    onClick={() => pickCountry(c)}
                  >
                    <span className="te-phone-field__flag">{c.flag}</span>
                    <span className="te-phone-field__name">{c.nameRu}</span>
                    <span className="te-phone-field__code">+{c.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="te-phone-field__hint">
        {complete ? (
          <span className="te-phone-field__e164">{normalizePhoneE164(buildE164(country, national))}</span>
        ) : (
          <>Можно вставить полный номер, например +375299785592</>
        )}
      </p>
    </div>
  );
}
