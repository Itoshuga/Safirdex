import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthPage } from "@/app/[locale]/login/page";
import { redirect } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Auth.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  if (await getUserSession()) return redirect({ href: "/account", locale });
  return <AuthPage initialMode="signup" />;
}
