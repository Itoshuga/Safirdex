import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PrivacyForm } from "@/components/community/privacy-form";
import { TradePrivacyForm } from "@/components/collection/trade-privacy-form";
import { UsernameOnboarding } from "@/components/community/username-onboarding";
import { getAccountProfile } from "@/features/community/server/profile-service";
import { getTradePrivacySettings } from "@/features/collection/server/collection-service";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Settings.navigation" });
  return { title: t("privacy") };
}

export default async function PrivacySettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const session = await getUserSession();
  if (!session) return null;
  const [profile, tradeSettings, t] = await Promise.all([
    getAccountProfile(session.uid),
    getTradePrivacySettings(session.uid),
    getTranslations({ locale, namespace: "Account" }),
  ]);

  if (!profile) {
    return <UsernameOnboarding suggestedName={session.name ?? session.email?.split("@")[0] ?? t("fallbackPlayer")} />;
  }

  return <div className="space-y-5"><PrivacyForm visibility={profile.view.visibility} /><TradePrivacyForm initialSettings={tradeSettings} /></div>;
}
