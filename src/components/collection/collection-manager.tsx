"use client";

import { Search, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { CollectionCard } from "@/components/collection/collection-card";
import { Button } from "@/components/ui/button";
import { calculateCollectionStats } from "@/features/collection/domain";
import type { CollectionEntryState, CollectionPageData } from "@/features/collection/types";
import { Link } from "@/i18n/navigation";

type Status = "all" | "owned" | "missing" | "duplicates" | "trades";

const selectClass = "h-10 min-w-0 rounded-xl border bg-card px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-ring";

export function CollectionManager({ data }: { data: CollectionPageData }) {
  const t = useTranslations("Collection");
  const [items, setItems] = useState(data.items);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [season, setSeason] = useState("");
  const [setId, setSetId] = useState("");
  const [rarity, setRarity] = useState("");
  const [faction, setFaction] = useState("");
  const [type, setType] = useState("");

  const stats = useMemo(
    () => calculateCollectionStats(items, data.stats.totalCollectibleCards),
    [items, data.stats.totalCollectibleCards],
  );
  const seasonStats = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; total: number; owned: number }>();
    for (const item of items) {
      if (!item.card.season) continue;
      const current = groups.get(item.card.season.id) ?? { id: item.card.season.id, name: item.card.season.name, total: 0, owned: 0 };
      current.total += 1;
      if (item.ownedQuantity > 0) current.owned += 1;
      groups.set(current.id, current);
    }
    return [...groups.values()];
  }, [items]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalized || item.card.name.toLocaleLowerCase().includes(normalized) || String(item.card.number).includes(normalized);
      const matchesStatus = status === "all" ||
        (status === "owned" && item.ownedQuantity > 0) ||
        (status === "missing" && item.ownedQuantity === 0) ||
        (status === "duplicates" && item.duplicateQuantity > 0) ||
        (status === "trades" && item.tradeQuantity > 0);
      return matchesQuery && matchesStatus &&
        (!season || item.card.relationIds.seasonId === season) &&
        (!setId || item.card.relationIds.setId === setId) &&
        (!rarity || item.card.relationIds.rarityId === rarity) &&
        (!faction || item.card.relationIds.factionIds.includes(faction)) &&
        (!type || item.card.relationIds.typeIds.includes(type));
    });
  }, [items, query, status, season, setId, rarity, faction, type]);

  function updateEntry(entry: CollectionEntryState) {
    setItems((current) => current.map((item) => item.cardId === entry.cardId ? { ...item, ...entry } : item));
  }

  function reset() {
    setQuery(""); setStatus("all"); setSeason(""); setSetId(""); setRarity(""); setFaction(""); setType("");
  }

  const percentage = Math.round(stats.completionPercentage * 10) / 10;
  return (
    <>
      <section className="border-b bg-[linear-gradient(180deg,color-mix(in_oklch,var(--safir)_8%,transparent),transparent)]">
        <div className="site-container py-10 sm:py-14">
          <p className="eyebrow">{t("hero.eyebrow")}</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">{t("hero.title")}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t("hero.description")}</p>
          <div className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-5">
            {[
              [t("stats.unique"), stats.uniqueOwnedCards],
              [t("stats.missing"), Math.max(stats.totalCollectibleCards - stats.uniqueOwnedCards, 0)],
              [t("stats.copies"), stats.totalOwnedCopies],
              [t("stats.duplicates"), stats.duplicateCopies],
              [t("stats.trades"), stats.tradeCopies],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border bg-card/75 p-4 backdrop-blur">
                <p className="text-[0.68rem] font-semibold text-muted-foreground">{label}</p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          {stats.uniqueOwnedCards === 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-safir/20 bg-safir/5 p-4">
              <div><p className="text-sm font-semibold">{t("emptyCollection.title")}</p><p className="mt-1 text-xs text-muted-foreground">{t("emptyCollection.description")}</p></div>
              <Button variant="outline" nativeButton={false} render={<Link href="/cards" />}>{t("emptyCollection.action")}</Button>
            </div>
          ) : null}
          <div className="mt-4 rounded-2xl border bg-card/75 p-4">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold">{t("stats.progress", { owned: stats.uniqueOwnedCards, total: stats.totalCollectibleCards })}</span>
              <span className="font-mono text-muted-foreground">{percentage}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t("stats.completion", { percentage })} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-safir transition-[width]" style={{ width: `${Math.min(100, percentage)}%` }} />
            </div>
          </div>
          {seasonStats.length ? (
            <div className="mt-4">
              <p className="mb-2 text-[0.68rem] font-semibold text-muted-foreground">{t("stats.bySeason")}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {seasonStats.map((item) => {
                  const value = item.total ? Math.round((item.owned / item.total) * 100) : 0;
                  return <button key={item.id} type="button" onClick={() => setSeason(item.id)} className="min-w-36 rounded-xl border bg-card/75 p-3 text-left transition hover:border-safir/40"><span className="block truncate text-xs font-semibold">{item.name}</span><span className="mt-1 block font-mono text-sm tabular-nums">{value}%</span></button>;
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <section className="site-container py-8 sm:py-10">
        <div className="sticky top-2 z-20 rounded-2xl border bg-background/92 p-3 shadow-sm backdrop-blur-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("filters.searchPlaceholder")} aria-label={t("filters.search")} className="h-11 w-full rounded-xl border bg-card pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" aria-label={t("filters.status")}>
            {(["all", "owned", "missing", "duplicates", "trades"] as const).map((value) => (
              <Button key={value} type="button" size="sm" variant={status === value ? "secondary" : "ghost"} className="rounded-full px-3" onClick={() => setStatus(value)}>{t(`filters.${value}`)}</Button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            <FilterSelect label={t("filters.season")} value={season} onChange={setSeason} options={data.options.seasons} />
            <FilterSelect label={t("filters.set")} value={setId} onChange={setSetId} options={data.options.sets.filter((option) => !season || option.seasonId === season)} />
            <FilterSelect label={t("filters.rarity")} value={rarity} onChange={setRarity} options={data.options.rarities} />
            <FilterSelect label={t("filters.faction")} value={faction} onChange={setFaction} options={data.options.factions} />
            <FilterSelect label={t("filters.type")} value={type} onChange={setType} options={data.options.types} />
            <Button variant="outline" className="h-10" onClick={reset}>{t("filters.reset")}</Button>
          </div>
        </div>
        <p className="my-5 text-xs font-semibold text-muted-foreground">{t("filters.results", { count: filtered.length })}</p>
        {filtered.length ? (
          <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((item) => <CollectionCard key={item.cardId} item={item} onChange={updateEntry} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed py-20 text-center">
            <SearchX className="mx-auto size-9 text-muted-foreground/50" />
            <h2 className="mt-4 font-heading text-xl font-semibold">{t("empty.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("empty.description")}</p>
          </div>
        )}
      </section>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ id: string; name: string }> }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className={selectClass}>
      <option value="">{label}</option>
      {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  );
}
