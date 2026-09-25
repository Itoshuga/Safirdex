import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getAdminLocale } from "@/lib/i18n/admin-locale";

export const metadata: Metadata = {
  title: { default: "Admin | Safir Codex", template: "%s | Safir Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [session, locale] = await Promise.all([
    getAdminSession(),
    getAdminLocale(),
  ]);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminShell email={session.email ?? session.uid} locale={locale}>
      {children}
    </AdminShell>
  );
}
