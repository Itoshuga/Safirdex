import "server-only";

import { getLocale } from "next-intl/server";

import type { AppLocale } from "@/lib/i18n/locales";

export async function getAdminLocale(): Promise<AppLocale> {
  return getLocale();
}
