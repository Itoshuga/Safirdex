import type { Metadata } from "next";
import { BadgeCheck, CalendarDays, Mail, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SettingsSection } from "@/components/settings/settings-section";
import { DeleteAccountPanel } from "@/components/settings/delete-account-panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { hasAdminClaim } from "@/lib/auth/claims";
import { getUserSession } from "@/lib/auth/user-session";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { resolveLocale } from "@/lib/i18n/locales";
import { getAccountProfile } from "@/features/community/server/profile-service";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Settings.navigation" });
  return { title: t("account") };
}

export default async function AccountSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const session = await getUserSession();
  if (!session) return null;
  const [t, user, profile] = await Promise.all([
    getTranslations({ locale, namespace: "Settings.account" }),
    getFirebaseAdminAuth().getUser(session.uid),
    getAccountProfile(session.uid),
  ]);
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const createdAt = user.metadata.creationTime ? formatter.format(new Date(user.metadata.creationTime)) : t("unknown");
  const providerLabels: Record<string, string> = {
    password: t("emailProvider"),
    "google.com": "Google",
    "apple.com": "Apple",
    "microsoft.com": "Microsoft",
    "github.com": "GitHub",
  };
  const providers = user.providerData.map((provider) => providerLabels[provider.providerId] ?? t("externalProvider")).join(", ") || t("unknown");
  const supportsPassword = user.providerData.some((provider) => provider.providerId === "password");

  return (
    <div className="space-y-6">
      <SettingsSection eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
        <dl className="divide-y rounded-xl border">
          <div className="flex items-start gap-3 p-4">
            <Mail className="mt-0.5 size-4 text-safir" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-muted-foreground">{t("email")}</dt>
              <dd className="mt-1 truncate text-sm font-medium">{user.email ?? t("unknown")}</dd>
            </div>
            {user.emailVerified ? <BadgeCheck className="ml-auto size-4 text-emerald-600" aria-label={t("verified")} /> : null}
          </div>
          <div className="flex items-start gap-3 p-4">
            <ShieldCheck className="mt-0.5 size-4 text-safir" aria-hidden="true" />
            <div><dt className="text-xs font-semibold text-muted-foreground">{t("provider")}</dt><dd className="mt-1 text-sm font-medium">{providers}</dd></div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <CalendarDays className="mt-0.5 size-4 text-safir" aria-hidden="true" />
            <div><dt className="text-xs font-semibold text-muted-foreground">{t("createdAt")}</dt><dd className="mt-1 text-sm font-medium">{createdAt}</dd></div>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("emailHelp")}</p>
        {hasAdminClaim(session) ? (
          <Button className="mt-5" variant="outline" nativeButton={false} render={<Link href="/admin" />}>
            <ShieldCheck /> {t("openAdmin")}
          </Button>
        ) : null}
      </SettingsSection>

      <SettingsSection className="border-destructive/25" eyebrow={t("dangerEyebrow")} title={t("dangerTitle")} description={t("dangerDescription")}>
        <DeleteAccountPanel
          email={user.email ?? session.email ?? ""}
          confirmationValue={profile?.view.username ?? "DELETE"}
          supportsPassword={supportsPassword}
        />
      </SettingsSection>
    </div>
  );
}
