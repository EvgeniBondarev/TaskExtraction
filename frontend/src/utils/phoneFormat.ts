import {
  DEFAULT_PHONE_COUNTRY,
  PhoneCountry,
  detectCountryFromDigits,
} from "./phoneCountries";

export type { PhoneCountry };

const E164_MIN = 10;
const E164_MAX = 15;

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** E.164: + и 10–15 цифр */
export function normalizePhoneE164(raw: string, fallbackCountry?: PhoneCountry): string {
  let digits = digitsOnly(raw);
  if (!digits) return "";

  // Россия: 8XXXXXXXXXX → 7XXXXXXXXXX
  if (digits.startsWith("8") && digits.length === 11 && (!fallbackCountry || fallbackCountry.dial === "7")) {
    digits = "7" + digits.slice(1);
  }

  const detected = detectCountryFromDigits(digits);
  if (detected) {
    const national = digits.slice(detected.dial.length);
    const maxNat = Math.max(...detected.nationalLengths);
    return `+${detected.dial}${national.slice(0, maxNat)}`;
  }

  if (fallbackCountry) {
    const maxNat = Math.max(...fallbackCountry.nationalLengths);
    const national = digits.startsWith(fallbackCountry.dial)
      ? digits.slice(fallbackCountry.dial.length)
      : digits;
    return `+${fallbackCountry.dial}${national.slice(0, maxNat)}`;
  }

  return `+${digits.slice(0, E164_MAX)}`;
}

export function parsePhoneE164(e164: string): { country: PhoneCountry; national: string } {
  const digits = digitsOnly(e164);
  if (!digits) {
    return { country: DEFAULT_PHONE_COUNTRY, national: "" };
  }

  const detected = detectCountryFromDigits(digits);
  if (detected) {
    return {
      country: detected,
      national: digits.slice(detected.dial.length),
    };
  }

  return { country: DEFAULT_PHONE_COUNTRY, national: digits };
}

/** Группировка цифр для читаемости */
export function formatNationalDisplay(national: string, country: PhoneCountry): string {
  const d = digitsOnly(national);
  if (!d) return "";

  if (country.iso === "RU" || country.iso === "KZ") {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
  }

  if (country.iso === "BY") {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  }

  // Универсально: блоки по 3
  return d.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export function isPhoneComplete(e164: string): boolean {
  const normalized = normalizePhoneE164(e164);
  const digits = digitsOnly(normalized);
  if (digits.length < E164_MIN || digits.length > E164_MAX) return false;

  const { country, national } = parsePhoneE164(normalized);
  return country.nationalLengths.includes(national.length);
}

export function buildE164(country: PhoneCountry, national: string): string {
  const n = digitsOnly(national).slice(0, Math.max(...country.nationalLengths));
  return n ? `+${country.dial}${n}` : "";
}
