import { defineRouting } from "next-intl/routing";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/locales";

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    name: "safir_locale",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  },
  alternateLinks: true,
});
