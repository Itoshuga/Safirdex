import { ChevronLeft, ChevronRight, LayoutGrid, List, SearchX } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CardPreview } from "@/components/cards/card-preview";
import { CardListRow } from "@/components/cards/card-list-row";
import {
  CodexActiveFilters,
  CodexFilters,
} from "@/components/cards/codex-filters";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { getCodexPage } from "@/features/cards/server/codex-service";
import { getCollectionEntriesForCards } from "@/features/collection/server/collection-service";
import type { CodexQueryState } from "@/features/cards/types";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";
import { getUserSession } from "@/lib/auth/user-session";
import { emptyCollectionEntry } from "@/features/collection/domain";

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

function cardsHref(
  query: CodexQueryState,
  overrides: {
    view?: CodexQueryState["view"];
    page?: number;
    cursor?: string;
    cursorDirection?: CodexQueryState["cursorDirection"];
  } = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.season) params.set("season", query.season);
  if (query.set) params.set("set", query.set);
  if (query.rarity) params.set("rarity", query.rarity);
  if (query.type) params.set("type", query.type);
  if (query.commander !== undefined) params.set("commander", String(query.commander));
  if (query.promo !== undefined) params.set("promo", String(query.promo));
  if (query.sort !== "number") params.set("sort", query.sort);
  const view = overrides.view ?? query.view;
  const page = overrides.page ?? query.page;
  const cursor = overrides.cursor ?? query.cursor;
  const cursorDirection = overrides.cursorDirection ?? query.cursorDirection;
  if (view !== "grid") params.set("view", view);
  if (page > 1 && cursor) {
    params.set("page", String(page));
    params.set("cursor", cursor);
    if (cursorDirection === "before") params.set("direction", "before");
  }
  const serialized = params.toString();
  return serialized ? `/cards?${serialized}` : "/cards";
}

function viewHref(query: CodexQueryState, view: CodexQueryState["view"]) {
  return cardsHref(query, { view });
}

export default async function CardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, rawSearchParams, hero, results, display] = await Promise.all([
    params,
    searchParams,
    getTranslations("Cards.hero"),
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
        <section className="border-b bg-[linear-gradient(180deg,color-mix(in_oklch,var(--safir)_7%,transparent),transparent)]">
          <div className="site-container py-10 sm:py-14">
            <p className="eyebrow">{hero("eyebrow")}</p>
            <div className="mt-3 max-w-3xl">
              <h1 className="font-heading text-5xl font-semibold tracking-[-0.065em] sm:text-7xl">{hero("title")}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{hero("description")}</p>
            </div>
          </div>
        </section>
        <section className="site-container py-8 sm:py-10">
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
              <div className="flex items-end gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-semibold tracking-[-0.035em]">{results("title")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.query.q
                      ? results("filteredOnPage", { count: data.items.length })
                      : results("loaded", { count: data.fetchedCount })}
                    {data.pageCount > 1 ? ` ${results("page", { page: data.query.page, pages: data.pageCount })}` : ""}
                  </p>
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
              </div>
            </div>
            <CodexActiveFilters options={data.options} query={data.query} />
            {data.query.q ? <p className="text-[0.68rem] text-muted-foreground md:hidden">{results("searchNote")}</p> : null}
              {data.items.length ? (
                <div className={data.query.view === "grid" ? "grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-6" : "space-y-2.5"}>
                  {data.items.map((card, index) => data.query.view === "grid"
                    ? <CardPreview key={card.id} card={card} eager={index < 2} collectionEntry={collectionEntries ? collectionEntries.get(card.id) ?? emptyCollectionEntry(card.id) : undefined} />
                    : <CardListRow key={card.id} card={card} collectionEntry={collectionEntries ? collectionEntries.get(card.id) ?? emptyCollectionEntry(card.id) : undefined} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed px-6 py-20 text-center">
                  <SearchX className="mx-auto size-9 text-muted-foreground/55" />
                  <h2 className="mt-4 font-heading text-xl font-semibold">{results("emptyTitle")}</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{results("emptyDescription")}</p>
                  <Button className="mt-6" nativeButton={false} render={<Link href={data.query.view === "list" ? "/cards?view=list" : "/cards"} />}>
                    {results("reset")}
                  </Button>
                </div>
              )}
              {data.pageCount > 1 ? (
                <nav className="flex items-center justify-between gap-4 border-t pt-6" aria-label={results("paginationLabel")}>
                  {data.previousCursor ? (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={
                        <Link
                          href={cardsHref(data.query, {
                            page: data.query.page - 1,
                            cursor: data.query.page - 1 === 1 ? undefined : data.previousCursor,
                            cursorDirection: "before",
                          })}
                          prefetch={false}
                          aria-label={results("previous")}
                        />
                      }
                    >
                      <ChevronLeft /> <span className="hidden sm:inline">{results("previous")}</span>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled aria-label={results("previous")}>
                      <ChevronLeft /> <span className="hidden sm:inline">{results("previous")}</span>
                    </Button>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-semibold tabular-nums">{results("page", { page: data.query.page, pages: data.pageCount })}</p>
                    <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{results("perPage", { count: data.fetchedCount })}</p>
                  </div>
                  {data.nextCursor ? (
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={
                        <Link
                          href={cardsHref(data.query, {
                            page: data.query.page + 1,
                            cursor: data.nextCursor,
                            cursorDirection: "after",
                          })}
                          prefetch={false}
                          aria-label={results("next")}
                        />
                      }
                    >
                      <span className="hidden sm:inline">{results("next")}</span> <ChevronRight />
                    </Button>
                  ) : (
                    <Button variant="outline" disabled aria-label={results("next")}>
                      <span className="hidden sm:inline">{results("next")}</span> <ChevronRight />
                    </Button>
                  )}
                </nav>
              ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
