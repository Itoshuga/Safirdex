import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CommunityHub } from "@/components/community/community-hub";
import { getCommunityPageData } from "@/features/community/server/community-service";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Community.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/community`, languages: { fr: "/fr/community", en: "/en/community" } },
  };
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const locale = resolveLocale((await params).locale);
  const [session, query] = await Promise.all([getUserSession(), searchParams]);
  const mode = query.feed === "following" ? "following" : "discover";
  const cursor = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const data = await getCommunityPageData({
    locale,
    viewerId: session?.uid ?? null,
    mode,
    cursor,
  });
  return (
    <CommunityHub
      mode={data.mode}
      people={data.people}
      recentDecks={data.recentDecks}
      feed={data.feed}
      signedIn={Boolean(session)}
      viewerId={session?.uid ?? null}
      locale={locale}
    />
  );
}
