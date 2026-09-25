import { defaultLocale, type AppLocale } from "@/lib/i18n/locales";
import type { TranslationMap } from "@/types/i18n";

export function getLocalizedValue<T>(
  translations: TranslationMap<T>,
  locale: AppLocale,
): T {
  const value = translations[locale] ?? translations[defaultLocale];

  if (value === undefined) {
    const firstAvailableValue = Object.values(translations)[0];

    if (firstAvailableValue === undefined) {
      throw new Error("No translation is available for this content.");
    }

    return firstAvailableValue;
  }

  return value;
}
