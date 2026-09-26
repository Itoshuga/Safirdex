"use client";

import { Check, Crown, Minus, Plus } from "lucide-react";
import Image from "next/image";
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
import { SAFIR_STANDARD_RULESET } from "@/features/decks/rules/ruleset";
import type { DeckCatalogCard } from "@/features/decks/types";
import { cn } from "@/lib/utils";

export function DeckBuilderCard({
  card,
  quantity,
  compatible,
  canAdd,
  onAdd,
  onRemove,
}: {
  card: DeckCatalogCard;
  quantity: number;
  compatible: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("Decks.builder");
  const atMaximum = quantity >= SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard;

  const quantityControl = (
    <div className="grid h-9 grid-cols-[2.25rem_1fr_2.25rem] items-center overflow-hidden rounded-lg border bg-background">
      <button type="button" className="grid h-full place-items-center transition hover:bg-muted disabled:opacity-35" disabled={!quantity} aria-label={t("remove")} onClick={onRemove}><Minus className="size-3.5" /></button>
      <span className="border-x text-center font-mono text-xs font-semibold tabular-nums">{quantity}/{SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard}</span>
      <button type="button" className="grid h-full place-items-center text-safir transition hover:bg-safir/10 disabled:opacity-35" disabled={!canAdd || atMaximum} aria-label={t("add")} onClick={onAdd}><Plus className="size-3.5" /></button>
    </div>
  );

  return (
    <Sheet>
      <article className={cn("group flex min-h-full flex-col overflow-hidden rounded-2xl border bg-card transition hover:border-safir/40 hover:shadow-sm", quantity > 0 && "border-safir/50 ring-1 ring-safir/10")}>
        <SheetTrigger
          render={<button type="button" className="relative block aspect-[4/3] w-full overflow-hidden bg-muted/55 text-left" aria-label={t("quickView", { name: card.name })} />}
        >
          {card.artwork.url ? <Image src={card.artwork.url} alt={card.name} fill className="object-contain p-2 transition duration-200 group-hover:scale-[1.015]" sizes="(min-width: 1280px) 18vw, (min-width: 640px) 30vw, 50vw" /> : null}
          {compatible ? <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/92 px-2 py-1 text-[0.6rem] font-semibold text-safir shadow-sm backdrop-blur" title={t("compatibleTooltip")}><Crown className="size-3" /> {t("compatibleBadge")}</span> : null}
          {quantity > 0 ? <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-safir px-2 py-1 text-[0.62rem] font-bold text-safir-foreground shadow-sm"><Check className="size-3" /> {quantity}/{SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard}</span> : null}
        </SheetTrigger>

        <div className="flex flex-1 flex-col p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><h3 className="truncate text-sm font-semibold">{card.name}</h3><p className="mt-0.5 text-[0.62rem] text-muted-foreground">#{String(card.number).padStart(3, "0")}{card.types?.[0] ? ` · ${card.types[0].name}` : ""}</p></div>
            {card.rarity?.color ? <span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: card.rarity.color }} title={card.rarity.name} /> : null}
          </div>

          <dl className="mt-3 grid grid-cols-3 border-y py-2 text-center">
            <div><dt className="text-[0.55rem] font-semibold tracking-wide text-muted-foreground">ATK</dt><dd className="mt-0.5 font-mono text-xs font-semibold">{card.attack ?? 0}</dd></div>
            <div className="border-x"><dt className="text-[0.55rem] font-semibold tracking-wide text-muted-foreground">VAL</dt><dd className="mt-0.5 font-mono text-xs font-semibold">{card.value}</dd></div>
            <div><dt className="text-[0.55rem] font-semibold tracking-wide text-muted-foreground">DEF</dt><dd className="mt-0.5 font-mono text-xs font-semibold">{card.defense ?? 0}</dd></div>
          </dl>

          <div className="mt-auto pt-3">
            {quantity === 0 ? <Button type="button" variant="outline" className="h-9 w-full rounded-lg" disabled={!canAdd} onClick={onAdd}><Plus /> {t("addCard")}</Button> : quantityControl}
          </div>
        </div>
      </article>

      <SheetContent side="right" className="w-[min(94vw,30rem)] gap-0 overflow-y-auto p-0 sm:max-w-[30rem]">
        <div className="relative aspect-[4/3] shrink-0 bg-muted/55">
          {card.artwork.url ? <Image src={card.artwork.url} alt={card.name} fill className="object-contain p-5" sizes="30rem" /> : null}
        </div>
        <SheetHeader className="border-b px-6 py-5 pr-14">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">#{String(card.number).padStart(3, "0")}</Badge>{compatible ? <Badge variant="secondary"><Crown /> {t("compatibleBadge")}</Badge> : null}</div>
          <SheetTitle className="mt-3 text-2xl font-semibold">{card.name}</SheetTitle>
          <SheetDescription className="mt-2 leading-6">{card.description || "—"}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap gap-2">{card.types?.map((type) => <Badge key={type.id} variant="secondary">{type.name}</Badge>)}{card.rarity ? <Badge variant="outline" style={{ borderColor: card.rarity.color, color: card.rarity.color }}>{card.rarity.name}</Badge> : null}{card.season ? <Badge variant="outline">{card.season.name}</Badge> : null}</div>
          <dl className="grid grid-cols-3 overflow-hidden rounded-xl border text-center">
            <div className="p-4"><dt className="text-[0.6rem] font-semibold text-muted-foreground">ATK</dt><dd className="mt-1 font-mono text-xl font-semibold">{card.attack ?? 0}</dd></div>
            <div className="border-x p-4"><dt className="text-[0.6rem] font-semibold text-muted-foreground">VAL</dt><dd className="mt-1 font-mono text-xl font-semibold">{card.value}</dd></div>
            <div className="p-4"><dt className="text-[0.6rem] font-semibold text-muted-foreground">DEF</dt><dd className="mt-1 font-mono text-xl font-semibold">{card.defense ?? 0}</dd></div>
          </dl>
          <div><p className="mb-2 text-xs font-semibold">{t("quantityInDeck")}</p>{quantityControl}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
