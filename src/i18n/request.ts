import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { formats } from "@/i18n/formats";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/lib/i18n/locales";

const namespaces = [
  "common",
  "navigation",
  "home",
  "auth",
  "account",
  "dashboard",
  "cards",
  "admin",
  "community",
  "profile",
  "decks",
] as const;

async function loadMessages(locale: string) {
  const modules = await Promise.all(
    namespaces.map((namespace) => import(`../../messages/${locale}/${namespace}.json`)),
  );

  return Object.assign({}, ...modules.map((module) => module.default));
}

export default getRequestConfig(async ({ locale, requestLocale }) => {
  let resolvedLocale: AppLocale;

  if (!locale) {
    // `next/root-params` cannot run inside Server Actions. `requestLocale`
    // resolves the locale propagated by next-intl's middleware and works in
    // routes, Server Components and Server Actions alike.
    const requestedLocale = await requestLocale;

    if (!requestedLocale) {
      resolvedLocale = routing.defaultLocale;
    } else {
      if (!hasLocale(routing.locales, requestedLocale)) notFound();
      resolvedLocale = requestedLocale;
    }
  } else {
    resolvedLocale = locale;
  }

  return {
    locale: resolvedLocale,
    messages: await loadMessages(resolvedLocale),
    formats,
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[i18n]", error);
      }
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});
