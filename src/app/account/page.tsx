import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountDashboard } from "@/components/account/account-dashboard";
import { hasAdminClaim } from "@/lib/auth/claims";
import { getUserSession } from "@/lib/auth/user-session";

export const metadata: Metadata = {
  title: "Mon espace | Safirdex",
  description: "Gérez votre compte et votre collection Safir.",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [session, params] = await Promise.all([
    getUserSession(),
    searchParams,
  ]);

  if (!session) {
    redirect("/login");
  }

  return (
    <AccountDashboard
      welcome={params.welcome === "1"}
      user={{
        displayName: session.name ?? session.email?.split("@")[0] ?? "Joueur",
        email: session.email ?? "Adresse non disponible",
        emailVerified: session.email_verified ?? false,
        isAdmin: hasAdminClaim(session),
      }}
    />
  );
}
