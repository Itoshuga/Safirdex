"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  CodexFilterOptions,
  CodexQueryState,
} from "@/features/cards/types";
import { Link } from "@/i18n/navigation";

function resetHref(view: CodexQueryState["view"]) {
  return view === "list" ? "/cards?view=list" : "/cards";
}

function queryParams(query: CodexQueryState, omit?: keyof CodexQueryState) {
  const params = new URLSearchParams();
  const values: Array<[keyof CodexQueryState, string | boolean | undefined]> = [
    ["q", query.q || undefined],
    ["season", query.season],
    ["set", query.set],
    ["rarity", query.rarity],
    ["type", query.type],
    ["commander", query.commander],
    ["promo", query.promo],
    ["sort", query.sort === "number" ? undefined : query.sort],
    ["view", query.view === "grid" ? undefined : query.view],
  ];
  for (const [key, value] of values) {
    if (key !== omit && value !== undefined) params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `/cards?${serialized}` : "/cards";
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function FilterFields({
  options,
  query,
}: {
  options: CodexFilterOptions;
  query: CodexQueryState;
}) {
  const t = useTranslations("Cards.filters");
  const selectedSeasonId = options.seasons.find(
    (season) => season.slug === query.season,
  )?.id;
  const visibleSets = options.sets.filter(
    (set) => !selectedSeasonId || set.seasonId === selectedSeasonId,
  );

  return (
    <div className="divide-y">
      <section className="px-6 py-5">
        <GroupTitle>{t("searchGroup")}</GroupTitle>
        <label className="block">
          <span className="sr-only">{t("searchLabel")}</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="admin-input h-11 pl-10"
              type="search"
              name="q"
              defaultValue={query.q}
              placeholder={t("search")}
            />
          </span>
        </label>
      </section>

      <section className="space-y-4 px-6 py-5">
        <GroupTitle>{t("catalogueGroup")}</GroupTitle>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">{t("season")}</span>
          <select className="admin-input h-11" name="season" defaultValue={query.season ?? ""}>
            <option value="">{t("all")}</option>
            {options.seasons.map((option) => <option key={option.id} value={option.slug}>{option.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">{t("set")}</span>
          <select className="admin-input h-11" name="set" defaultValue={query.set ?? ""}>
            <option value="">{t("all")}</option>
            {visibleSets.map((option) => <option key={option.id} value={option.slug}>{option.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">{t("rarity")}</span>
            <select className="admin-input h-11" name="rarity" defaultValue={query.rarity ?? ""}>
              <option value="">{t("all")}</option>
              {options.rarities.map((option) => <option key={option.id} value={option.slug}>{option.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">{t("type")}</span>
            <select className="admin-input h-11" name="type" defaultValue={query.type ?? ""}>
              <option value="">{t("all")}</option>
              {options.types.map((option) => <option key={option.id} value={option.slug}>{option.name}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="px-6 py-5">
        <GroupTitle>{t("traitsGroup")}</GroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">{t("commander")}</span>
            <select className="admin-input h-11" name="commander" defaultValue={query.commander === undefined ? "" : String(query.commander)}>
              <option value="">{t("any")}</option>
              <option value="true">{t("yes")}</option>
              <option value="false">{t("no")}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">{t("promo")}</span>
            <select className="admin-input h-11" name="promo" defaultValue={query.promo === undefined ? "" : String(query.promo)}>
              <option value="">{t("any")}</option>
              <option value="true">{t("yes")}</option>
              <option value="false">{t("no")}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="px-6 py-5">
        <GroupTitle>{t("sortGroup")}</GroupTitle>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium">{t("sort")}</span>
          <select className="admin-input h-11" name="sort" defaultValue={query.sort}>
            <option value="number">{t("sortNumber")}</option>
            <option value="newest">{t("sortNewest")}</option>
            <option value="oldest">{t("sortOldest")}</option>
          </select>
        </label>
      </section>
    </div>
  );
}

export function CodexFilters({
  options,
  query,
}: {
  options: CodexFilterOptions;
  query: CodexQueryState;
}) {
  const t = useTranslations("Cards.filters");
  const activeCount = [query.q, query.season, query.set, query.rarity, query.type, query.commander, query.promo]
    .filter((value) => value !== undefined && value !== "").length;

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="lg" className="h-10" />}>
        <SlidersHorizontal />
        {t("title")}
        {activeCount ? <Badge className="ml-1 h-5 min-w-5 justify-center px-1.5">{activeCount}</Badge> : null}
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(94vw,28rem)] gap-0 p-0 sm:max-w-[28rem]">
        <SheetHeader className="border-b px-6 py-5 pr-14">
          <SheetTitle className="text-xl font-semibold">{t("title")}</SheetTitle>
          <SheetDescription className="mt-1 leading-5">{t("description")}</SheetDescription>
        </SheetHeader>
        <form method="get" className="flex min-h-0 flex-1 flex-col">
          {query.view === "list" ? <input type="hidden" name="view" value="list" /> : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FilterFields options={options} query={query} />
          </div>
          <div className="flex flex-col gap-2 border-t bg-popover p-4 sm:grid sm:grid-cols-[1fr_auto] sm:gap-3">
            <Button type="submit" size="lg" className="w-full">
              <Search /> {t("apply")}
            </Button>
            <Button variant="ghost" size="lg" className="w-full" nativeButton={false} render={<Link href={resetHref(query.view)} />}>
              {t("clearAll")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function CodexActiveFilters({
  options,
  query,
}: {
  options: CodexFilterOptions;
  query: CodexQueryState;
}) {
  const t = useTranslations("Cards.filters");
  const active = [
    query.q ? { key: "q" as const, label: `“${query.q}”` } : null,
    query.season ? { key: "season" as const, label: options.seasons.find((item) => item.slug === query.season)?.name ?? query.season } : null,
    query.set ? { key: "set" as const, label: options.sets.find((item) => item.slug === query.set)?.name ?? query.set } : null,
    query.rarity ? { key: "rarity" as const, label: options.rarities.find((item) => item.slug === query.rarity)?.name ?? query.rarity } : null,
    query.type ? { key: "type" as const, label: options.types.find((item) => item.slug === query.type)?.name ?? query.type } : null,
    query.commander !== undefined ? { key: "commander" as const, label: `${t("commander")}: ${query.commander ? t("yes") : t("no")}` } : null,
    query.promo !== undefined ? { key: "promo" as const, label: `${t("promo")}: ${query.promo ? t("yes") : t("no")}` } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return active.length ? (
    <div className="flex flex-wrap items-center gap-2" aria-label={t("active")}>
      {active.map((filter) => (
        <Link
          key={filter.key}
          href={queryParams(query, filter.key)}
          className="inline-flex h-7 items-center gap-1 rounded-full border bg-card px-2.5 text-[0.68rem] font-medium transition hover:border-safir/40 hover:text-safir"
          aria-label={t("remove", { filter: filter.label })}
        >
          {filter.label} <X className="size-3" />
        </Link>
      ))}
      <Link href={resetHref(query.view)} className="text-[0.68rem] font-semibold text-muted-foreground hover:text-foreground hover:underline">
        {t("clearAll")}
      </Link>
    </div>
  ) : null;
}
