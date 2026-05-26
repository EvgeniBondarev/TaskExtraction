export interface PhoneCountry {
  iso: string;
  nameRu: string;
  dial: string;
  flag: string;
  /** Длина национальной части (без кода страны) */
  nationalLengths: number[];
}

/** Порядок: длинные коды первыми для корректного разбора (+375 до +3). */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "BY", nameRu: "Беларусь", dial: "375", flag: "🇧🇾", nationalLengths: [9] },
  { iso: "UA", nameRu: "Украина", dial: "380", flag: "🇺🇦", nationalLengths: [9] },
  { iso: "KZ", nameRu: "Казахстан", dial: "7", flag: "🇰🇿", nationalLengths: [10] },
  { iso: "RU", nameRu: "Россия", dial: "7", flag: "🇷🇺", nationalLengths: [10] },
  { iso: "UZ", nameRu: "Узбекистан", dial: "998", flag: "🇺🇿", nationalLengths: [9] },
  { iso: "GE", nameRu: "Грузия", dial: "995", flag: "🇬🇪", nationalLengths: [9] },
  { iso: "AM", nameRu: "Армения", dial: "374", flag: "🇦🇲", nationalLengths: [8] },
  { iso: "AZ", nameRu: "Азербайджан", dial: "994", flag: "🇦🇿", nationalLengths: [9] },
  { iso: "MD", nameRu: "Молдова", dial: "373", flag: "🇲🇩", nationalLengths: [8] },
  { iso: "LT", nameRu: "Литва", dial: "370", flag: "🇱🇹", nationalLengths: [8] },
  { iso: "LV", nameRu: "Латвия", dial: "371", flag: "🇱🇻", nationalLengths: [8] },
  { iso: "EE", nameRu: "Эстония", dial: "372", flag: "🇪🇪", nationalLengths: [7, 8] },
  { iso: "DE", nameRu: "Германия", dial: "49", flag: "🇩🇪", nationalLengths: [10, 11] },
  { iso: "PL", nameRu: "Польша", dial: "48", flag: "🇵🇱", nationalLengths: [9] },
  { iso: "TR", nameRu: "Турция", dial: "90", flag: "🇹🇷", nationalLengths: [10] },
  { iso: "US", nameRu: "США", dial: "1", flag: "🇺🇸", nationalLengths: [10] },
  { iso: "GB", nameRu: "Великобритания", dial: "44", flag: "🇬🇧", nationalLengths: [10] },
  { iso: "IL", nameRu: "Израиль", dial: "972", flag: "🇮🇱", nationalLengths: [9] },
  { iso: "AE", nameRu: "ОАЭ", dial: "971", flag: "🇦🇪", nationalLengths: [9] },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES.find((c) => c.iso === "RU")!;

export function countriesByDialLength(): PhoneCountry[] {
  return [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
}

export function findCountryByIso(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_PHONE_COUNTRY;
}

export function detectCountryFromDigits(allDigits: string): PhoneCountry | null {
  if (!allDigits) return null;
  for (const c of countriesByDialLength()) {
    if (allDigits.startsWith(c.dial)) {
      const national = allDigits.slice(c.dial.length);
      if (national.length === 0 || c.nationalLengths.includes(national.length)) {
        return c;
      }
      if (national.length <= Math.max(...c.nationalLengths)) {
        return c;
      }
    }
  }
  return null;
}
