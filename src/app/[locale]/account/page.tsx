import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProfilePage } from "@/components/community/profile-page";
import { UsernameOnboarding } from "@/components/community/username-onboarding";
import { PublicHeader } from "@/components/layout/public-header";
import {
  getAccountProfile,
  getConnectionPage,
  getProfileTabContent,
  parseProfileTab,
} from "@/features/community/server/profile-service";
import { redirect } from "@/i18n/navigation";
import { hasAdminClaim } from "@/lib/auth/claims";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Profile.metadata.account" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const locale = resolveLocale((await params).locale);
  const session = await getUserSession();
  if (!session) return redirect({ href: "/login", locale });
  const profile = await getAccountProfile(session.uid);
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <main className="site-container grid min-h-[calc(100vh-5rem)] place-items-center py-12">
          <UsernameOnboarding suggestedName={session.name ?? session.email?.split("@")[0] ?? "Player"} />
        </main>
      </div>
    );
  }
  const query = await searchParams;
  const tab = parseProfileTab(query.tab);
  const cursor = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const content = await getProfileTabContent({
    profile: profile.internal,
    tab,
    locale,
    owner: true,
    cursor,
  });
  const connectionKind: "followers" | "following" | undefined =
    query.connections === "followers" || query.connections === "following"
    ? query.connections
    : undefined;
  const connectionCursor = Array.isArray(query.connectionCursor)
    ? query.connectionCursor[0]
    : query.connectionCursor;
  const connections = connectionKind
    ? {
        kind: connectionKind,
        ...(await getConnectionPage({
          profileId: profile.internal.id,
          viewerId: session.uid,
          kind: connectionKind,
          cursor: connectionCursor,
        })),
      }
    : undefined;

  return (
    <ProfilePage
      profile={profile.view}
      viewer={{ signedIn: true, isOwner: true, isFollowing: false }}
      mode="owner"
      tab={tab}
      content={content}
      basePath="/account"
      owner={{ userId: session.uid, email: session.email ?? "", isAdmin: hasAdminClaim(session) }}
      connections={connections}
    />
  );
}
