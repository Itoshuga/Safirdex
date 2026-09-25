import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { formats } from "@/i18n/formats";
import { routing } from "@/i18n/routing";

const namespaces = [
  "common",
  "navigation",
  "home",
  "auth",
  "account",
  "dashboard",
  "cards",
  "admin",
] as const;

async function loadMessages(locale: string) {
  const modules = await Promise.all(
    namespaces.map((namespace) => import(`../../messages/${locale}/${namespace}.json`)),
  );

  return Object.assign({}, ...modules.map((module) => module.default));
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();

    if (!hasLocale(routing.locales, paramValue)) {
      notFound();
    }

    locale = paramValue;
  }

  return {
    locale,
    messages: await loadMessages(locale),
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
