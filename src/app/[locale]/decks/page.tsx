import { Filter, Layers3, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
  return { title: t("title"), description: t("description") };
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
  const [hero, list, factions] = await Promise.all([
    getTranslations({ locale, namespace: "Decks.hero" }),
    getTranslations({ locale, namespace: "Decks.list" }),
    factionsRepository.getAll(),
  ]);
  const scope = value(query.scope) === "mine" && session ? "mine" : "community";
  const rawSort = value(query.sort);
  const sort: DeckSort = rawSort === "updated" || rawSort === "name" ? rawSort : "recent";
  const commander = value(query.commander);
  const page = await listDecks({
    locale,
    viewerId: session?.uid ?? null,
    scope,
    search: value(query.q),
    factionId: value(query.faction),
    commander: commander === "yes" || commander === "no" ? commander : undefined,
    sort,
    cursor: value(query.cursor),
  });
  const nextHref = (() => {
    if (!page.nextCursor) return null;
    const next = new URLSearchParams();
    for (const [key, entry] of Object.entries(query)) {
      const current = value(entry);
      if (current && key !== "cursor") next.set(key, current);
    }
    next.set("cursor", page.nextCursor);
    return `/decks?${next.toString()}`;
  })();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b bg-[linear-gradient(135deg,color-mix(in_oklch,var(--safir)_11%,transparent),transparent_65%)]">
          <div className="site-container flex flex-col gap-6 py-10 sm:py-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl"><p className="eyebrow">{hero("eyebrow")}</p><h1 className="mt-3 font-heading text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">{hero("title")}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{hero("description")}</p></div>
            <Button size="lg" nativeButton={false} render={<Link href={session ? "/decks/new" : "/login"} />}><Plus /> {hero("create")}</Button>
          </div>
        </section>
        <section className="site-container py-8 sm:py-10">
          <div className="mb-5 flex flex-wrap items-center gap-2 border-b pb-5">
            <Button variant={scope === "community" ? "default" : "ghost"} nativeButton={false} render={<Link href="/decks" />}>{list("community")}</Button>
            {session ? <Button variant={scope === "mine" ? "default" : "ghost"} nativeButton={false} render={<Link href="/decks?scope=mine" />}>{list("mine")}</Button> : null}
          </div>
          <form className="mb-7 grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem_12rem_auto]">
            {scope === "mine" ? <input type="hidden" name="scope" value="mine" /> : null}
            <input className="admin-input" type="search" name="q" defaultValue={value(query.q)} placeholder={list("search")} />
            <select className="admin-input" name="faction" defaultValue={value(query.faction) ?? ""}><option value="">{list("allFactions")}</option>{factions.map((faction) => <option key={faction.id} value={faction.id}>{localizedLabel(faction.translations, locale)}</option>)}</select>
            <select className="admin-input" name="commander" defaultValue={commander ?? ""}><option value="">{list("commanderAny")}</option><option value="yes">{list("commanderYes")}</option><option value="no">{list("commanderNo")}</option></select>
            <select className="admin-input" name="sort" defaultValue={sort}><option value="recent">{list("recent")}</option><option value="updated">{list("updated")}</option><option value="name">{list("name")}</option></select>
            <Button type="submit"><Filter /> {list("apply")}</Button>
          </form>
          {page.items.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{page.items.map((deck) => <DeckPreview key={deck.id} deck={deck} />)}</div> : <div className="rounded-2xl border border-dashed px-6 py-20 text-center"><Layers3 className="mx-auto size-10 text-muted-foreground/45" /><h2 className="mt-4 font-heading text-2xl font-semibold">{list("emptyTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{list("emptyDescription")}</p></div>}
          {nextHref ? <div className="mt-8 flex justify-center"><Button variant="outline" size="lg" nativeButton={false} render={<Link href={nextHref} prefetch={false} />}>{list("loadMore")}</Button></div> : null}
        </section>
      </main>
    </div>
  );
}
