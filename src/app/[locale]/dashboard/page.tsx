import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import AccountPage from "@/app/[locale]/account/page";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Dashboard.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

export default AccountPage;
