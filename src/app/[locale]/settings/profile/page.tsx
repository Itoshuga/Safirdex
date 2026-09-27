import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProfileEditor } from "@/components/community/profile-editor";
import { UsernameOnboarding } from "@/components/community/username-onboarding";
import { getAccountProfile } from "@/features/community/server/profile-service";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Settings.navigation" });
  return { title: t("profile") };
}

export default async function ProfileSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const session = await getUserSession();
  if (!session) return null;
  const [profile, t] = await Promise.all([
    getAccountProfile(session.uid),
    getTranslations({ locale, namespace: "Account" }),
  ]);

  if (!profile) {
    return <UsernameOnboarding suggestedName={session.name ?? session.email?.split("@")[0] ?? t("fallbackPlayer")} />;
  }

  return <ProfileEditor profile={profile.view} userId={session.uid} />;
}
