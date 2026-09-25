export const supportedLocales = ["en", "fr"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "en";

export function resolveLocale(
  locale: string | string[] | undefined,
): AppLocale {
  const candidate = Array.isArray(locale) ? locale[0] : locale;

  return supportedLocales.includes(candidate as AppLocale)
    ? (candidate as AppLocale)
    : defaultLocale;
}
