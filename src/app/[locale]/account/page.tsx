import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AccountDashboard } from "@/components/account/account-dashboard";
import { redirect } from "@/i18n/navigation";
import { hasAdminClaim } from "@/lib/auth/claims";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Account.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Account" });
  const session = await getUserSession();

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  const profile = (
    await getFirebaseAdminFirestore().collection("users").doc(session.uid).get()
  ).data();

  return (
    <AccountDashboard
      user={{
        displayName:
          (profile?.displayName as string | undefined) ??
          session.name ??
          session.email?.split("@")[0] ??
          t("fallbackPlayer"),
        pseudonym: (profile?.pseudonym as string | undefined) ?? t("fallbackPseudonym"),
        email: session.email ?? t("emailUnavailable"),
        emailVerified: session.email_verified ?? false,
        isAdmin: hasAdminClaim(session),
        role:
          (profile?.role as "user" | "admin" | undefined) ??
          (hasAdminClaim(session) ? "admin" : "user"),
      }}
    />
  );
}
