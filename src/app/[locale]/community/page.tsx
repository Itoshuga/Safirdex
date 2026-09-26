import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CommunityHub } from "@/components/community/community-hub";
import { getCommunityPageData } from "@/features/community/server/community-service";
import { redirect } from "@/i18n/navigation";
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
  if (mode === "following" && !session) return redirect({ href: "/login", locale });
  const q = Array.isArray(query.q) ? query.q[0] ?? "" : query.q ?? "";
  const cursor = Array.isArray(query.cursor) ? query.cursor[0] : query.cursor;
  const data = await getCommunityPageData({
    locale,
    viewerId: session?.uid ?? null,
    mode,
    query: q,
    cursor,
  });
  return <CommunityHub mode={data.mode} query={data.query} people={data.people} feed={data.feed} signedIn={Boolean(session)} />;
}

