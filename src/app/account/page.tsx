import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountDashboard } from "@/components/account/account-dashboard";
import { hasAdminClaim } from "@/lib/auth/claims";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getUserSession } from "@/lib/auth/user-session";

export const metadata: Metadata = {
  title: "Mon espace | Safirdex",
  description: "Gérez votre compte et votre collection Safir.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
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
          "Joueur",
        pseudonym: (profile?.pseudonym as string | undefined) ?? "joueur",
        email: session.email ?? "Adresse non disponible",
        emailVerified: session.email_verified ?? false,
        isAdmin: hasAdminClaim(session),
        role:
          (profile?.role as "user" | "admin" | undefined) ??
          (hasAdminClaim(session) ? "admin" : "user"),
      }}
    />
  );
}
