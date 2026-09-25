import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  resolveLocale,
  type AppLocale,
} from "@/lib/i18n/locales";

export const ADMIN_LOCALE_COOKIE = "safir_admin_locale";

export async function getAdminLocale(): Promise<AppLocale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return value ? resolveLocale(value) : DEFAULT_LOCALE;
}
