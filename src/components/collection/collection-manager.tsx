"use client";

import { ArrowLeft, GalleryVerticalEnd, Library, Search, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { CardPreview } from "@/components/cards/card-preview";
import { Button } from "@/components/ui/button";
import { calculateCollectionStats } from "@/features/collection/domain";
import type {
  CollectionEntryState,
  CollectionPageData,
} from "@/features/collection/types";
import { Link } from "@/i18n/navigation";

const selectClass = "h-10 min-w-0 rounded-xl border bg-card px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-ring";

export function CollectionManager({
  data,
  seasonSlug,
}: {
  data: CollectionPageData;
  seasonSlug: string;
}) {
  const t = useTranslations("Collection");
  const [items, setItems] = useState(data.items);
  const [query, setQuery] = useState("");
  const [setId, setSetId] = useState("");
  const [rarity, setRarity] = useState("");
  const [faction, setFaction] = useState("");
  const [type, setType] = useState("");

  const season = data.options.seasons.find((option) => option.slug === seasonSlug)!;
  const seasonItems = useMemo(
    () => items.filter((item) => item.card.relationIds.seasonId === season.id),
    [items, season.id],
  );
  const stats = useMemo(
    () => calculateCollectionStats(seasonItems, seasonItems.length),
    [seasonItems],
  );
  const ownedItems = useMemo(
    () => seasonItems.filter((item) => item.ownedQuantity > 0),
    [seasonItems],
  );
  const visibleSets = data.options.sets.filter((option) => option.seasonId === season.id);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return ownedItems.filter((item) => {
      const matchesQuery = !normalized ||
        item.card.name.toLocaleLowerCase().includes(normalized) ||
        String(item.card.number).includes(normalized);
      return matchesQuery &&
        (!setId || item.card.relationIds.setId === setId) &&
        (!rarity || item.card.relationIds.rarityId === rarity) &&
        (!faction || item.card.relationIds.factionIds.includes(faction)) &&
        (!type || item.card.relationIds.typeIds.includes(type));
    });
  }, [ownedItems, query, setId, rarity, faction, type]);
  const percentage = Math.round(stats.completionPercentage * 10) / 10;

  function updateEntry(entry: CollectionEntryState) {
    setItems((current) => current.map((item) =>
      item.cardId === entry.cardId ? { ...item, ...entry } : item,
    ));
  }

  function resetFilters() {
    setQuery("");
    setSetId("");
    setRarity("");
    setFaction("");
    setType("");
  }

  return (
    <>
      <section className="relative border-b">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="surface-grid absolute inset-0 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute -top-44 left-[12%] size-80 rounded-full bg-safir/10 blur-3xl" />
        </div>

        <div className="site-container relative py-9 sm:py-12">
          <Link
            href="/account?tab=collection"
            className="mb-7 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("seasonPage.back")}
          </Link>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)] lg:items-end">
            <div>
              <p className="eyebrow">{t("seasonPage.eyebrow")}</p>
              <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
                {season.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                {t("seasonPage.description")}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/88 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">
                  <Library className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.68rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    {t("seasonPage.progress")}
                  </p>
                  <p className="mt-1 font-heading text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                    {t("seasons.cards", {
                      owned: stats.uniqueOwnedCards,
                      total: stats.totalCollectibleCards,
                    })}
                  </p>
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={t("stats.completion", { percentage })}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full rounded-full bg-safir" style={{ width: `${Math.min(100, percentage)}%` }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 border-t bg-muted/15">
                {[
                  [t("stats.copies"), stats.totalOwnedCopies],
                  [t("stats.duplicates"), stats.duplicateCopies],
                  [t("stats.trades"), stats.tradeCopies],
                ].map(([label, value], index) => (
                  <div key={label} className={`px-4 py-3.5 sm:px-5 ${index ? "border-l" : ""}`}>
                    <p className="truncate text-[0.62rem] font-medium text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-4">
            <nav aria-label={t("navigation.label")} className="flex gap-1 overflow-x-auto">
              <Link
                href={`/cards?season=${encodeURIComponent(season.slug)}`}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <GalleryVerticalEnd className="size-4" aria-hidden="true" />
                {t("navigation.cards")}
              </Link>
              <Link
                href="/account?tab=collection"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Library className="size-4" aria-hidden="true" />
                {t("navigation.collection")}
              </Link>
            </nav>
          </div>
        </div>
      </section>

      <section className="site-container py-8 sm:py-10" aria-labelledby="owned-cards-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b pb-4">
          <div>
            <p className="eyebrow">{t("seasonPage.ownedEyebrow")}</p>
            <h2 id="owned-cards-title" className="mt-2 font-heading text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              {t("seasonPage.ownedTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("seasons.ownedCards", { count: ownedItems.length })}
            </p>
          </div>
          <p className="font-mono text-sm font-semibold text-safir tabular-nums">
            {t("seasons.completion", { percentage })}
          </p>
        </div>

        {ownedItems.length ? (
          <>
            <div className="sticky top-2 z-20 rounded-2xl border bg-background/92 p-3 shadow-sm backdrop-blur-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("filters.searchPlaceholder")}
                  aria-label={t("filters.search")}
                  className="h-11 w-full rounded-xl border bg-card pr-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                <FilterSelect label={t("filters.set")} value={setId} onChange={setSetId} options={visibleSets} />
                <FilterSelect label={t("filters.rarity")} value={rarity} onChange={setRarity} options={data.options.rarities} />
                <FilterSelect label={t("filters.faction")} value={faction} onChange={setFaction} options={data.options.factions} />
                <FilterSelect label={t("filters.type")} value={type} onChange={setType} options={data.options.types} />
                <Button variant="outline" className="h-10" onClick={resetFilters}>{t("filters.reset")}</Button>
              </div>
            </div>

            <p className="my-5 text-xs font-semibold text-muted-foreground">
              {t("filters.results", { count: filtered.length })}
            </p>
            {filtered.length ? (
              <div className="grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((item, index) => (
                  <CardPreview
                    key={item.cardId}
                    card={item.card}
                    eager={index < 2}
                    collectionEntry={item}
                    onCollectionChange={updateEntry}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed py-20 text-center">
                <SearchX className="mx-auto size-9 text-muted-foreground/50" aria-hidden="true" />
                <h3 className="mt-4 font-heading text-xl font-semibold">{t("empty.title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t("empty.description")}</p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
            <Library className="mx-auto size-8 text-muted-foreground/45" aria-hidden="true" />
            <h3 className="mt-4 font-heading text-xl font-semibold">{t("seasonPage.emptyTitle")}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("seasonPage.emptyDescription")}</p>
            <Button className="mt-6" nativeButton={false} render={<Link href={`/cards?season=${encodeURIComponent(season.slug)}`} />}>
              {t("emptyCollection.action")}
            </Button>
          </div>
        )}
      </section>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className={selectClass}>
      <option value="">{label}</option>
      {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  );
}
