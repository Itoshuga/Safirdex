import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { CollectionQuantityControls } from "@/components/collection/collection-quantity-controls";
import type { CardListItem } from "@/features/cards/types";
import type { CollectionEntryState } from "@/features/collection/types";
import { Link } from "@/i18n/navigation";

export function CardListRow({ card, collectionEntry }: { card: CardListItem; collectionEntry?: CollectionEntryState }) {
  const labels = useTranslations("Cards.labels");
  const showCollectionAction = Boolean(collectionEntry && card.collectible);

  return (
    <article className={`overflow-hidden rounded-2xl border bg-card/80 ${showCollectionAction ? "sm:grid sm:grid-cols-[minmax(0,1fr)_12rem]" : ""}`}>
      <Link
        href={`/cards/${card.slug}`}
        prefetch={false}
        className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 p-2.5 transition hover:bg-muted/25 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:grid-cols-[4.25rem_minmax(0,1fr)_auto] sm:gap-4 sm:p-3"
        aria-label={`${card.name}, ${labels("number", { number: card.number })}`}
      >
        <div className="relative aspect-[5/7] overflow-hidden rounded-lg border bg-muted/40">
          {card.artwork.url ? (
            <Image
              src={card.artwork.url}
              alt={card.artwork.alt}
              fill
              className={card.artwork.orientation === "horizontal" ? "object-contain p-1" : "object-cover"}
              sizes="68px"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground/40">
              <ImageIcon className="size-5" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[0.65rem] font-semibold text-safir">
              {labels("number", { number: String(card.number).padStart(3, "0") })}
            </span>
            <h2 className="truncate font-heading text-base font-semibold tracking-[-0.025em] sm:text-lg">
              {card.name}
            </h2>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {[card.season?.name, card.set?.name].filter(Boolean).join(" · ") || labels("unknownRelation")}
          </p>
        </div>

        <div className="flex items-center gap-2 pr-1">
          {card.rarity ? (
            <span
              className="size-2.5 shrink-0 rounded-full ring-3 ring-current/10"
              style={{ color: card.rarity.color, backgroundColor: card.rarity.color ?? "currentColor" }}
              title={card.rarity.name}
            />
          ) : null}
          <span className="hidden text-xs font-medium text-muted-foreground md:inline">{card.rarity?.name}</span>
        </div>
      </Link>
      {collectionEntry && card.collectible ? (
        <div className="bg-muted/10 sm:border-l sm:[&>div]:h-full sm:[&>div]:border-t-0">
          <CollectionQuantityControls cardId={card.id} cardName={card.name} initialEntry={collectionEntry} compact compactVariant="catalogue" />
        </div>
      ) : null}
    </article>
  );
}
