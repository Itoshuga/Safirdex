import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { SettingsShell } from "@/components/settings/settings-shell";
import { redirect } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Settings.metadata" });
  return {
    title: { default: t("title"), template: `%s | Safirdex` },
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  const session = await getUserSession();
  if (!session) return redirect({ href: "/login", locale });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <SettingsShell>{children}</SettingsShell>
    </div>
  );
}
