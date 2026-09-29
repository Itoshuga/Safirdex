"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { CollectionQuantityControls } from "@/components/collection/collection-quantity-controls";
import { Badge } from "@/components/ui/badge";
import type { CollectionCardView, CollectionEntryState } from "@/features/collection/types";
import { Link } from "@/i18n/navigation";

export function CollectionCard({
  item,
  onChange,
}: {
  item: CollectionCardView;
  onChange: (entry: CollectionEntryState) => void;
}) {
  const { card } = item;
  const t = useTranslations("Collection.quantity");
  return (
    <article className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:border-safir/35 hover:shadow-md ${card.artwork.orientation === "horizontal" ? "sm:col-span-2" : ""}`}>
      <Link href={`/cards/${card.slug}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring">
        <div className={`relative overflow-hidden bg-muted/40 ${card.artwork.orientation === "horizontal" ? "aspect-[7/5]" : "aspect-[5/7]"}`}>
          {card.artwork.url ? (
            <Image src={card.artwork.url} alt={card.artwork.alt} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground/40"><ImageIcon className="size-8" /></div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 font-mono text-[0.62rem] font-semibold text-white backdrop-blur">
            N°{String(card.number).padStart(3, "0")}
          </span>
          {item.ownedQuantity === 0 ? <span className="absolute right-2 top-2 rounded-md border border-white/15 bg-white/85 px-2 py-1 text-[0.6rem] font-semibold text-black backdrop-blur">{t("notOwned")}</span> : null}
        </div>
        <div className="p-3">
          <h2 className="truncate font-heading text-base font-semibold">{card.name}</h2>
          <p className="mt-1 truncate text-[0.68rem] text-muted-foreground">{[card.season?.name, card.set?.name].filter(Boolean).join(" · ")}</p>
          <div className="mt-2 flex min-h-5 gap-1 overflow-hidden">
            {card.rarity ? <Badge variant="outline" className="text-[0.6rem]">{card.rarity.name}</Badge> : null}
            {card.types.slice(0, 1).map((type) => <Badge key={type.id} variant="secondary" className="text-[0.6rem]">{type.name}</Badge>)}
          </div>
        </div>
      </Link>
      <div className="border-t bg-muted/15 p-3">
        <CollectionQuantityControls cardId={card.id} cardName={card.name} initialEntry={item} onChange={onChange} />
      </div>
    </article>
  );
}
