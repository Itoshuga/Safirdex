export const SUPPORTED_LOCALES = ["fr", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";
export const FALLBACK_LOCALE: AppLocale = DEFAULT_LOCALE;

export const LOCALE_CONFIG: Record<
  AppLocale,
  {
    code: AppLocale;
    label: string;
    nativeName: string;
    shortLabel: string;
    dateLocale: string;
  }
> = {
  fr: {
    code: "fr",
    label: "Français",
    nativeName: "Français",
    shortLabel: "FR",
    dateLocale: "fr-FR",
  },
  en: {
    code: "en",
    label: "English",
    nativeName: "English",
    shortLabel: "EN",
    dateLocale: "en-GB",
  },
};

// Lowercase aliases keep existing imports readable while the uppercase exports
// remain the canonical configuration.
export const supportedLocales = SUPPORTED_LOCALES;
export const defaultLocale = DEFAULT_LOCALE;
export const fallbackLocale = FALLBACK_LOCALE;

export function isAppLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
}

export function resolveLocale(
  locale: string | string[] | undefined,
): AppLocale {
  const candidate = Array.isArray(locale) ? locale[0] : locale;
  const normalizedCandidate = candidate?.toLowerCase();

  return SUPPORTED_LOCALES.includes(normalizedCandidate as AppLocale)
    ? (normalizedCandidate as AppLocale)
    : DEFAULT_LOCALE;
}
