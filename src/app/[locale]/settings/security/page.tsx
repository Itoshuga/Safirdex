import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SecurityControls } from "@/components/settings/security-controls";
import { SettingsSection } from "@/components/settings/settings-section";
import { getUserSession } from "@/lib/auth/user-session";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Settings.navigation" });
  return { title: t("security") };
}

export default async function SecuritySettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const session = await getUserSession();
  if (!session) return null;
  const [t, user] = await Promise.all([
    getTranslations({ locale, namespace: "Settings.security" }),
    getFirebaseAdminAuth().getUser(session.uid),
  ]);
  const supportsPassword = user.providerData.some((provider) => provider.providerId === "password");

  return (
    <SettingsSection eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <SecurityControls email={user.email ?? session.email ?? ""} supportsPassword={supportsPassword} />
    </SettingsSection>
  );
}
