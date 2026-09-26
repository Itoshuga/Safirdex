"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CodexFilterOptions } from "@/features/cards/types";
import type { DeckCatalogFilters } from "@/features/decks/types";

export const EMPTY_DECK_FILTERS: DeckCatalogFilters = {
  search: "",
  factionIds: [],
  typeIds: [],
  rarityIds: [],
  seasonId: "",
  setId: "",
  attackMin: 0,
  attackMax: 9,
  valueMin: 0,
  valueMax: 9,
  defenseMin: 0,
  defenseMax: 9,
  compatibleOnly: false,
  membership: "all",
  sort: "number",
};

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function OptionGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Array<{ id: string; name: string; color?: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1 text-xs font-medium">
            <input type="checkbox" className="size-4 accent-safir" checked={selected.includes(option.id)} onChange={() => onToggle(option.id)} />
            {option.color ? <span className="size-2 rounded-full" style={{ backgroundColor: option.color }} /> : null}
            <span>{option.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StatRange({
  label,
  minimum,
  maximum,
  onMinimum,
  onMaximum,
}: {
  label: string;
  minimum: number;
  maximum: number;
  onMinimum: (value: number) => void;
  onMaximum: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2">
      <span className="text-xs font-semibold">{label}</span>
      <label><span className="sr-only">Minimum {label}</span><input className="admin-input h-9" type="number" min={0} max={9} value={minimum} onChange={(event) => onMinimum(Math.min(Number(event.target.value), maximum))} /></label>
      <label><span className="sr-only">Maximum {label}</span><input className="admin-input h-9" type="number" min={0} max={9} value={maximum} onChange={(event) => onMaximum(Math.max(Number(event.target.value), minimum))} /></label>
    </div>
  );
}

export function DeckFiltersSheet({
  filters,
  options,
  factions,
  resultCount,
  onChange,
  onReset,
}: {
  filters: DeckCatalogFilters;
  options: CodexFilterOptions;
  factions: Array<{ id: string; label: string; color?: string }>;
  resultCount: number;
  onChange: (filters: DeckCatalogFilters) => void;
  onReset: () => void;
}) {
  const t = useTranslations("Decks.builder.filters");
  const selectedSeasonId = filters.seasonId || undefined;
  const visibleSets = options.sets.filter((set) => !selectedSeasonId || set.seasonId === selectedSeasonId);
  const activeCount = filters.factionIds.length + filters.typeIds.length + filters.rarityIds.length +
    Number(Boolean(filters.seasonId)) + Number(Boolean(filters.setId)) +
    Number(filters.attackMin > 0 || filters.attackMax < 9) +
    Number(filters.valueMin > 0 || filters.valueMax < 9) +
    Number(filters.defenseMin > 0 || filters.defenseMax < 9);
  const patch = (value: Partial<DeckCatalogFilters>) => onChange({ ...filters, ...value });

  return (
    <Sheet>
      <SheetTrigger render={<Button type="button" variant="outline" className="h-10 rounded-xl" />}>
        <SlidersHorizontal /> {t("title")}
        {activeCount ? <Badge className="ml-1 h-5 min-w-5 justify-center px-1.5">{activeCount}</Badge> : null}
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(94vw,30rem)] gap-0 p-0 sm:max-w-[30rem]">
        <SheetHeader className="border-b px-6 py-5 pr-14">
          <SheetTitle className="text-xl font-semibold">{t("title")}</SheetTitle>
          <SheetDescription className="mt-1 leading-5">{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 divide-y overflow-y-auto">
          <section className="space-y-6 px-6 py-5">
            <OptionGroup title={t("factions")} options={factions.map((item) => ({ id: item.id, name: item.label, ...(item.color ? { color: item.color } : {}) }))} selected={filters.factionIds} onToggle={(id) => patch({ factionIds: toggle(filters.factionIds, id) })} />
            <OptionGroup title={t("types")} options={options.types} selected={filters.typeIds} onToggle={(id) => patch({ typeIds: toggle(filters.typeIds, id) })} />
            <OptionGroup title={t("rarities")} options={options.rarities} selected={filters.rarityIds} onToggle={(id) => patch({ rarityIds: toggle(filters.rarityIds, id) })} />
          </section>

          <section className="space-y-4 px-6 py-5">
            <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t("collection")}</p>
            <label className="block"><span className="mb-1.5 block text-xs font-medium">{t("season")}</span><select className="admin-input" value={filters.seasonId} onChange={(event) => patch({ seasonId: event.target.value, setId: "" })}><option value="">{t("all")}</option>{options.seasons.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium">{t("set")}</span><select className="admin-input" value={filters.setId} onChange={(event) => patch({ setId: event.target.value })}><option value="">{t("all")}</option>{visibleSets.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
          </section>

          <section className="space-y-3 px-6 py-5">
            <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 text-[0.6rem] font-semibold tracking-wide text-muted-foreground uppercase"><span>{t("stats")}</span><span>{t("minimum")}</span><span>{t("maximum")}</span></div>
            <StatRange label="ATK" minimum={filters.attackMin} maximum={filters.attackMax} onMinimum={(value) => patch({ attackMin: value })} onMaximum={(value) => patch({ attackMax: value })} />
            <StatRange label="VAL" minimum={filters.valueMin} maximum={filters.valueMax} onMinimum={(value) => patch({ valueMin: value })} onMaximum={(value) => patch({ valueMax: value })} />
            <StatRange label="DEF" minimum={filters.defenseMin} maximum={filters.defenseMax} onMinimum={(value) => patch({ defenseMin: value })} onMaximum={(value) => patch({ defenseMax: value })} />
          </section>
        </div>
        <SheetFooter className="grid grid-cols-[auto_1fr] gap-2 border-t bg-popover p-4">
          <Button type="button" variant="ghost" onClick={onReset}><RotateCcw /> {t("reset")}</Button>
          <SheetClose render={<Button type="button" />}>{t("showResults", { count: resultCount })}</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
