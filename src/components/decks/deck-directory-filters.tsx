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
import type { DeckSort } from "@/features/decks/types";
import { Link } from "@/i18n/navigation";

export interface DeckDirectoryQuery {
  scope: "community" | "mine";
  q: string;
  factionId: string;
  commander: "yes" | "no" | "";
  sort: DeckSort;
}

interface FactionOption {
  id: string;
  name: string;
}

type RemovableFilter = "q" | "factionId" | "commander" | "sort";

function defaultSort(scope: DeckDirectoryQuery["scope"]): DeckSort {
  return scope === "mine" ? "updated" : "recent";
}

function directoryHref(query: DeckDirectoryQuery, omit?: RemovableFilter) {
  const params = new URLSearchParams();
  if (query.scope === "mine") params.set("scope", "mine");
  if (query.q && omit !== "q") params.set("q", query.q);
  if (query.factionId && omit !== "factionId") params.set("faction", query.factionId);
  if (query.commander && omit !== "commander") params.set("commander", query.commander);
  if (query.sort !== defaultSort(query.scope) && omit !== "sort") params.set("sort", query.sort);
  const serialized = params.toString();
  return serialized ? `/decks?${serialized}` : "/decks";
}

function resetHref(scope: DeckDirectoryQuery["scope"]) {
  return scope === "mine" ? "/decks?scope=mine" : "/decks";
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function DeckDirectoryFilters({
  query,
  factions,
}: {
  query: DeckDirectoryQuery;
  factions: FactionOption[];
}) {
  const t = useTranslations("Decks.list");
  const sortIsActive = query.sort !== defaultSort(query.scope);
  const active = [
    query.q ? { key: "q" as const, label: `“${query.q}”` } : null,
    query.factionId
      ? {
          key: "factionId" as const,
          label: factions.find((faction) => faction.id === query.factionId)?.name ?? query.factionId,
        }
      : null,
    query.commander
      ? {
          key: "commander" as const,
          label: query.commander === "yes" ? t("commanderYes") : t("commanderNo"),
        }
      : null,
    sortIsActive
      ? {
          key: "sort" as const,
          label: t(query.sort),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-2xl border bg-background/88 p-2.5 shadow-sm sm:flex-row sm:items-center">
        <form method="get" className="flex min-w-0 flex-1 gap-2">
          {query.scope === "mine" ? <input type="hidden" name="scope" value="mine" /> : null}
          {query.factionId ? <input type="hidden" name="faction" value={query.factionId} /> : null}
          {query.commander ? <input type="hidden" name="commander" value={query.commander} /> : null}
          {query.sort !== defaultSort(query.scope) ? <input type="hidden" name="sort" value={query.sort} /> : null}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t("searchLabel")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              className="admin-input h-11 rounded-xl pr-4 pl-10"
              type="search"
              name="q"
              defaultValue={query.q}
              placeholder={t("search")}
            />
          </label>
          <Button type="submit" size="lg" className="h-11 rounded-xl px-4" aria-label={t("searchAction")}>
            <Search />
            <span className="hidden md:inline">{t("searchAction")}</span>
          </Button>
        </form>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="lg" className="h-11 rounded-xl px-4" />}>
            <SlidersHorizontal />
            {t("filters")}
            {active.length ? <Badge className="ml-1 h-5 min-w-5 justify-center px-1.5">{active.length}</Badge> : null}
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(94vw,28rem)] gap-0 p-0 sm:max-w-[28rem]">
            <SheetHeader className="border-b px-6 py-5 pr-14">
              <SheetTitle className="text-xl font-semibold">{t("filters")}</SheetTitle>
              <SheetDescription className="mt-1 leading-5">{t("filtersDescription")}</SheetDescription>
            </SheetHeader>
            <form method="get" className="flex min-h-0 flex-1 flex-col">
              {query.scope === "mine" ? <input type="hidden" name="scope" value="mine" /> : null}
              {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <section className="space-y-4 px-6 py-5">
                  <GroupTitle>{t("criteriaGroup")}</GroupTitle>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">{t("factionLabel")}</span>
                    <select className="admin-input h-11" name="faction" defaultValue={query.factionId}>
                      <option value="">{t("allFactions")}</option>
                      {factions.map((faction) => <option key={faction.id} value={faction.id}>{faction.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">{t("commanderLabel")}</span>
                    <select className="admin-input h-11" name="commander" defaultValue={query.commander}>
                      <option value="">{t("commanderAny")}</option>
                      <option value="yes">{t("commanderYes")}</option>
                      <option value="no">{t("commanderNo")}</option>
                    </select>
                  </label>
                </section>

                <section className="border-t px-6 py-5">
                  <GroupTitle>{t("sortGroup")}</GroupTitle>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium">{t("sortLabel")}</span>
                    <select className="admin-input h-11" name="sort" defaultValue={query.sort}>
                      {query.scope === "community" ? <option value="recent">{t("recent")}</option> : null}
                      <option value="updated">{t("updated")}</option>
                      <option value="name">{t("name")}</option>
                    </select>
                  </label>
                </section>
              </div>
              <div className="flex flex-col gap-2 border-t bg-popover p-4 sm:grid sm:grid-cols-[1fr_auto] sm:gap-3">
                <Button type="submit" size="lg" className="w-full">
                  <Search /> {t("apply")}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href={resetHref(query.scope)} />}
                >
                  {t("clearAll")}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {active.length ? (
        <div className="flex flex-wrap items-center gap-2" aria-label={t("activeFilters")}>
          {active.map((filter) => (
            <Link
              key={filter.key}
              href={directoryHref(query, filter.key)}
              className="inline-flex h-7 items-center gap-1 rounded-full border bg-card px-2.5 text-[0.68rem] font-medium transition hover:border-safir/40 hover:text-safir"
              aria-label={t("removeFilter", { filter: filter.label })}
            >
              {filter.label} <X className="size-3" aria-hidden="true" />
            </Link>
          ))}
          <Link href={resetHref(query.scope)} className="text-[0.68rem] font-semibold text-muted-foreground hover:text-foreground hover:underline">
            {t("clearAll")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
