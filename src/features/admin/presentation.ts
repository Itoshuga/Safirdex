import type { Timestamp } from "firebase-admin/firestore";

import { getTranslation } from "@/lib/i18n/get-localized-value";
import { LOCALE_CONFIG, type AppLocale } from "@/lib/i18n/locales";
import type { Translations } from "@/types/translation";

export function localizedLabel(
  translations: Translations<{ name?: string; label?: string }>,
  locale: AppLocale,
) {
  const translation = getTranslation(translations, locale);
  return translation?.name ?? translation?.label ?? "Untitled";
}

export function formatTimestamp(
  timestamp: Timestamp | null | undefined,
  locale: AppLocale,
  includeTime = false,
) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat(LOCALE_CONFIG[locale].dateLocale, {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  }).format(timestamp.toDate());
}

export function toDateInput(timestamp: Timestamp | null | undefined) {
  return timestamp?.toDate().toISOString().slice(0, 10) ?? "";
}
