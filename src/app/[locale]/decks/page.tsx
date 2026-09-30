import { Layers3, Plus, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  DeckDirectoryFilters,
  type DeckDirectoryQuery,
} from "@/components/decks/deck-directory-filters";
import { DeckDirectoryHeader } from "@/components/decks/deck-directory-header";
import { DeckPreview } from "@/components/decks/deck-preview";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { listDecks } from "@/features/decks/server/deck-service";
import type { DeckSort } from "@/features/decks/types";
import { Link } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { localizedLabel } from "@/features/admin/presentation";
import { resolveLocale } from "@/lib/i18n/locales";
import { factionsRepository } from "@/repositories/factions.repository";

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Decks.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/decks`,
      languages: { fr: "/fr/decks", en: "/en/decks" },
    },
  };
}

export default async function DecksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const locale = resolveLocale((await params).locale);
  const query = await searchParams;
  const session = await getUserSession();
  const [list, factions] = await Promise.all([
    getTranslations({ locale, namespace: "Decks.list" }),
    factionsRepository.getAll(),
  ]);
  const scope = value(query.scope) === "mine" && session ? "mine" : "community";
  const rawSort = value(query.sort);
  const defaultSort: DeckSort = scope === "mine" ? "updated" : "recent";
  const sort: DeckSort = rawSort === "name" || rawSort === "updated"
    ? rawSort
    : rawSort === "recent" && scope === "community"
      ? "recent"
      : defaultSort;
  const commanderValue = value(query.commander);
  const commander = commanderValue === "yes" || commanderValue === "no" ? commanderValue : "";
  const search = value(query.q)?.trim() ?? "";
  const factionId = value(query.faction) ?? "";
  const directoryQuery: DeckDirectoryQuery = {
    scope,
    q: search,
    factionId,
    commander,
    sort,
  };
  const factionOptions = factions.map((faction) => ({
    id: faction.id,
    name: localizedLabel(faction.translations, locale),
  }));
  const page = await listDecks({
    locale,
    viewerId: session?.uid ?? null,
    scope,
    search: search || undefined,
    factionId: factionId || undefined,
    commander: commander || undefined,
    sort,
    cursor: value(query.cursor),
  });
  const nextHref = (() => {
    if (!page.nextCursor) return null;
    const next = new URLSearchParams();
    if (scope === "mine") next.set("scope", "mine");
    if (search) next.set("q", search);
    if (factionId) next.set("faction", factionId);
    if (commander) next.set("commander", commander);
    if (sort !== defaultSort) next.set("sort", sort);
    next.set("cursor", page.nextCursor);
    return `/decks?${next.toString()}`;
  })();
  const hasActiveFilters = Boolean(search || factionId || commander || sort !== defaultSort);
  const resetHref = scope === "mine" ? "/decks?scope=mine" : "/decks";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <DeckDirectoryHeader scope={scope} signedIn={Boolean(session)} />
        <section className="site-container py-8 sm:py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-4">
            <div>
              <p className="eyebrow">{list("browseEyebrow")}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                {scope === "mine" ? list("mineTitle") : list("communityTitle")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {list("results", { count: page.items.length })}
              </p>
            </div>
            <Layers3 className="size-5 text-safir" aria-hidden="true" />
          </div>

          <DeckDirectoryFilters query={directoryQuery} factions={factionOptions} />

          {page.items.length ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {page.items.map((deck) => <DeckPreview key={deck.id} deck={deck} />)}
            </div>
          ) : (
            <div className="relative mt-7 overflow-hidden rounded-3xl border border-dashed px-6 py-16 text-center sm:py-20">
              <div className="surface-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
              <div className="relative">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Layers3 className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-heading text-2xl font-semibold">{list("emptyTitle")}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{list("emptyDescription")}</p>
                <Button
                  className="mt-6 rounded-full px-4"
                  variant={hasActiveFilters ? "outline" : "default"}
                  nativeButton={false}
                  render={<Link href={hasActiveFilters ? resetHref : session ? "/decks/new" : "/login"} />}
                >
                  {hasActiveFilters ? <RotateCcw /> : <Plus />}
                  {hasActiveFilters ? list("resetFilters") : list("createFirst")}
                </Button>
              </div>
            </div>
          )}
          {nextHref ? (
            <div className="mt-9 flex justify-center border-t pt-7">
              <Button variant="outline" size="lg" className="rounded-full px-4" nativeButton={false} render={<Link href={nextHref} prefetch={false} />}>
                {list("loadMore")}
              </Button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
