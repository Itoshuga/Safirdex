import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ProfilePage } from "@/components/community/profile-page";
import {
  getConnectionPage,
  getProfileTabContent,
  getPublicProfileView,
  parseProfileTab,
} from "@/features/community/server/profile-service";
import { redirect } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";
import { followsRepository } from "@/repositories/follows.repository";

type PageProps = {
  params: Promise<{ locale: string; username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeValue, username } = await params;
  const locale = resolveLocale(localeValue);
  const [profile, t] = await Promise.all([
    getPublicProfileView(decodeURIComponent(username)),
    getTranslations({ locale, namespace: "Profile.metadata.public" }),
  ]);
  if (!profile) return { title: t("notFound") };
  const title = t("title", { name: profile.view.displayName, username: profile.view.username });
  const description = profile.view.bio || t("description", { name: profile.view.displayName });
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/user/@${profile.view.username}`,
      languages: { fr: `/fr/user/@${profile.view.username}`, en: `/en/user/@${profile.view.username}` },
    },
    openGraph: { title, description, ...(profile.view.avatarUrl ? { images: [profile.view.avatarUrl] } : {}) },
  };
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const { locale: localeValue, username } = await params;
  const locale = resolveLocale(localeValue);
  const [profile, session, query] = await Promise.all([
    getPublicProfileView(decodeURIComponent(username)),
    getUserSession(),
    searchParams,
  ]);
  if (!profile) notFound();
  if (session?.uid === profile.internal.id) return redirect({ href: "/account", locale });
  if (profile.matchedAlias) return redirect({ href: `/user/@${profile.view.username}`, locale });
  const tab = parseProfileTab(query.tab);
  const cursor = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const [isFollowing, content] = await Promise.all([
    session ? followsRepository.isFollowing(session.uid, profile.internal.id) : false,
    getProfileTabContent({ profile: profile.internal, tab, locale, owner: false, cursor }),
  ]);
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
          viewerId: session?.uid ?? null,
          kind: connectionKind,
          cursor: connectionCursor,
        })),
      }
    : undefined;

  return (
    <ProfilePage
      profile={profile.view}
      viewer={{ signedIn: Boolean(session), isOwner: false, isFollowing }}
      mode="public"
      tab={tab}
      content={content}
      basePath={`/user/@${profile.view.username}`}
      connections={connections}
    />
  );
}
