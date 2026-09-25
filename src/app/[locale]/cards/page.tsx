import { LayoutGrid, List, SearchX } from "lucide-react";
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
import type { CodexQueryState } from "@/features/cards/types";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

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

function nextPageHref(query: CodexQueryState, cursor: string) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.season) params.set("season", query.season);
  if (query.set) params.set("set", query.set);
  if (query.rarity) params.set("rarity", query.rarity);
  if (query.type) params.set("type", query.type);
  if (query.commander !== undefined) params.set("commander", String(query.commander));
  if (query.promo !== undefined) params.set("promo", String(query.promo));
  if (query.sort !== "number") params.set("sort", query.sort);
  if (query.view !== "grid") params.set("view", query.view);
  params.set("cursor", cursor);
  return `/cards?${params.toString()}`;
}

function viewHref(query: CodexQueryState, view: CodexQueryState["view"]) {
  const href = nextPageHref(query, query.cursor ?? "");
  const params = new URLSearchParams(href.split("?")[1]);
  params.delete("cursor");
  if (query.cursor) params.set("cursor", query.cursor);
  if (view === "grid") params.delete("view");
  else params.set("view", view);
  const serialized = params.toString();
  return serialized ? `/cards?${serialized}` : "/cards";
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
  const data = await getCodexPage(locale, rawSearchParams);

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
                    {data.hasMore ? ` ${results("moreAvailable")}` : ""}
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
                    ? <CardPreview key={card.id} card={card} eager={index < 2} />
                    : <CardListRow key={card.id} card={card} />)}
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
              {data.nextCursor ? (
                <div className="flex justify-center border-t pt-6">
                  <Button size="lg" variant="outline" nativeButton={false} render={<Link href={nextPageHref(data.query, data.nextCursor)} prefetch={false} />}>
                    {results("loadMore")}
                  </Button>
                </div>
              ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
