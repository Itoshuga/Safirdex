import { GalleryVerticalEnd, LayoutGrid, List } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CardCatalogue } from "@/components/cards/card-catalogue";
import { CodexHeader } from "@/components/cards/codex-header";
import {
  CodexActiveFilters,
  CodexFilters,
} from "@/components/cards/codex-filters";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { cardsHref, viewHref } from "@/features/cards/cards-href";
import { getCodexPage } from "@/features/cards/server/codex-service";
import { CARD_PAGE_SIZE } from "@/features/cards/server/query-types";
import { getCollectionEntriesForCards } from "@/features/collection/server/collection-service";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";
import { getUserSession } from "@/lib/auth/user-session";

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Cards.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/cards`,
      languages: { fr: "/fr/cards", en: "/en/cards" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

export default async function CardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, rawSearchParams, results, display] = await Promise.all([
    params,
    searchParams,
    getTranslations("Cards.results"),
    getTranslations("Cards.display"),
  ]);
  const [data, session] = await Promise.all([
    getCodexPage(locale, rawSearchParams),
    getUserSession(),
  ]);
  const collectionEntries = session
    ? await getCollectionEntriesForCards(session.uid, data.items.map((card) => card.id))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <CodexHeader totalCount={data.totalCount} pageSize={CARD_PAGE_SIZE} />
        <section className="site-container py-8 sm:py-10">
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
              <div className="flex items-end gap-4">
                <div>
                  <p className="eyebrow">{results("eyebrow")}</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{results("title")}</h2>
                </div>
                {data.query.q ? <p className="hidden text-[0.68rem] text-muted-foreground md:block">{results("searchNote")}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <CodexFilters options={data.options} query={data.query} />
                <div className="flex items-center rounded-lg border bg-card p-1" aria-label={display("label")}>
                  <Button
                    variant={data.query.view === "grid" ? "secondary" : "ghost"}
                    size="icon-sm"
                    nativeButton={false}
                    render={<Link href={viewHref(data.query, "grid")} aria-label={display("grid")} />}
                  >
                    <LayoutGrid />
                  </Button>
                  <Button
                    variant={data.query.view === "list" ? "secondary" : "ghost"}
                    size="icon-sm"
                    nativeButton={false}
                    render={<Link href={viewHref(data.query, "list")} aria-label={display("list")} />}
                  >
                    <List />
                  </Button>
                </div>
                <GalleryVerticalEnd className="ml-1 hidden size-5 text-safir lg:block" aria-hidden="true" />
              </div>
            </div>
            <CodexActiveFilters options={data.options} query={data.query} />
            {data.query.q ? <p className="text-[0.68rem] text-muted-foreground md:hidden">{results("searchNote")}</p> : null}
            <CardCatalogue
              key={cardsHref(data.query)}
              locale={locale}
              initialItems={data.items}
              initialCollectionEntries={collectionEntries ? [...collectionEntries.values()] : null}
              query={data.query}
              nextCursor={data.nextCursor}
              previousCursor={data.previousCursor}
              pageCount={data.pageCount}
              fetchedCount={data.fetchedCount}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
