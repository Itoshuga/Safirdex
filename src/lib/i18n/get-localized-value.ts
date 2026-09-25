import { FALLBACK_LOCALE } from "@/lib/i18n/locales";
import type { Translations } from "@/types/translation";

function normalizeLocale(locale: string) {
  return locale.trim().replaceAll("_", "-").toLowerCase();
}

function getLocaleCandidates(locale: string, fallbackLocale: string) {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedFallback = normalizeLocale(fallbackLocale);
  const language = normalizedLocale.split("-")[0];
  const fallbackLanguage = normalizedFallback.split("-")[0];

  return [
    normalizedLocale,
    language,
    normalizedFallback,
    fallbackLanguage,
  ].filter((candidate, index, candidates) => {
    return Boolean(candidate) && candidates.indexOf(candidate) === index;
  });
}

export function getTranslation<T>(
  translations: Translations<T> | undefined,
  locale: string,
  fallbackLocale: string = FALLBACK_LOCALE,
): T | undefined {
  if (!translations) {
    return undefined;
  }

  const normalizedTranslations = new Map(
    Object.entries(translations).map(([key, value]) => [
      normalizeLocale(key),
      value,
    ]),
  );

  for (const candidate of getLocaleCandidates(locale, fallbackLocale)) {
    const translation = normalizedTranslations.get(candidate);

    if (translation !== undefined) {
      return translation;
    }
  }

  return Object.values(translations)[0];
}

export const getLocalizedValue = getTranslation;

export function getLocalizedName(
  translations: Translations<{ name: string }> | undefined,
  locale: string,
) {
  return getTranslation(translations, locale)?.name ?? "";
}

export function getLocalizedDescription(
  translations: Translations<{ description?: string }> | undefined,
  locale: string,
) {
  return getTranslation(translations, locale)?.description ?? "";
}
