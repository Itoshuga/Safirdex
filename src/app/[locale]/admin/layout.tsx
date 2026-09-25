import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminShell } from "@/components/admin/admin-shell";
import { redirect } from "@/i18n/navigation";
import { getAdminSession } from "@/lib/auth/admin-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Admin.metadata" });
  return { title: { default: t("title"), template: "%s | Safirdex" }, robots: { index: false, follow: false, nocache: true } };
}

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const [routeParams, session] = await Promise.all([params, getAdminSession()]);
  const locale = resolveLocale(routeParams.locale);

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  return (
    <AdminShell email={session.email ?? session.uid}>
      {children}
    </AdminShell>
  );
}
