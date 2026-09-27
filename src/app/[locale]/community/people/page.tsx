import { SearchX, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CommunityHeader } from "@/components/community/community-header";
import { UserCard } from "@/components/community/user-card";
import { PublicHeader } from "@/components/layout/public-header";
import { getCommunityPeoplePageData } from "@/features/community/server/community-service";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

type SearchParams = Record<string, string | string[] | undefined>;

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] ?? "" : input ?? "";
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const [locale, query] = await Promise.all([
    params.then(({ locale: localeValue }) => resolveLocale(localeValue)),
    searchParams,
  ]);
  const t = await getTranslations({ locale, namespace: "Community.people.metadata" });
  const hasSearch = Boolean(value(query.q).trim());
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/community/people`,
      languages: {
        fr: "/fr/community/people",
        en: "/en/community/people",
      },
    },
    ...(hasSearch ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CommunityPeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [locale, query, session] = await Promise.all([
    params.then(({ locale: localeValue }) => resolveLocale(localeValue)),
    searchParams,
    getUserSession(),
  ]);
  const data = await getCommunityPeoplePageData({
    viewerId: session?.uid ?? null,
    query: value(query.q),
  });
  const t = await getTranslations({ locale, namespace: "Community.people" });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <CommunityHeader active="people" initialQuery={data.query} />
        <section className="site-container py-8 sm:py-10">
          <div className="mb-7 flex items-end justify-between gap-4 border-b pb-5">
            <div>
              <p className="eyebrow">
                {data.query ? t("resultsEyebrow") : t("discoverEyebrow")}
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.035em]">
                {data.query ? t("results", { query: data.query }) : t("pageTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.query ? t("resultsDescription") : t("pageDescription")}
              </p>
            </div>
            <Users className="hidden size-6 text-safir sm:block" aria-hidden="true" />
          </div>

          {data.people.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.people.map((user) => (
                <UserCard
                  key={user.username}
                  user={user}
                  signedIn={Boolean(session)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed px-6 py-20 text-center">
              <SearchX className="mx-auto size-9 text-muted-foreground/45" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold">
                {data.query ? t("noResultsTitle", { query: data.query }) : t("emptyTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {data.query ? t("noResultsDescription") : t("empty")}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
