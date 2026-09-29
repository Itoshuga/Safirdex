import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { CollectionQuantityControls } from "@/components/collection/collection-quantity-controls";
import { Link } from "@/i18n/navigation";
import type { CardListItem } from "@/features/cards/types";
import type { CollectionEntryState } from "@/features/collection/types";

export interface CardPreviewProps {
  card: CardListItem;
  eager?: boolean;
  collectionEntry?: CollectionEntryState;
  onCollectionChange?: (entry: CollectionEntryState) => void;
}

export function CardPreview({ card, eager = false, collectionEntry, onCollectionChange }: CardPreviewProps) {
  const labels = useTranslations("Cards.labels");
  const isHorizontal = card.artwork.orientation === "horizontal";

  return (
    <article className={`relative flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border bg-card/80 transition duration-200 hover:border-safir/35 hover:shadow-[0_22px_50px_-38px_color-mix(in_oklch,var(--safir)_65%,transparent)] ${isHorizontal ? "col-span-2" : ""}`}>
      <Link
        href={`/cards/${card.slug}`}
        prefetch={false}
        className="group/artwork block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        aria-label={`${card.name}, ${labels("number", { number: card.number })}`}
      >
        <div
          className={`relative overflow-hidden bg-[radial-gradient(circle_at_50%_25%,color-mix(in_oklch,var(--safir)_14%,transparent),transparent_62%)] ${
            isHorizontal ? "aspect-[37/25]" : "aspect-[5/7]"
          }`}
        >
          {card.artwork.url ? (
            <Image
              src={card.artwork.url}
              alt={card.artwork.alt}
              fill
              loading={eager ? "eager" : "lazy"}
              className="object-cover transition duration-300 group-hover/artwork:scale-[1.015]"
              sizes={
                isHorizontal
                  ? "(max-width: 639px) 100vw, (max-width: 1023px) 66vw, (max-width: 1535px) 50vw, 34vw"
                  : "(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1535px) 25vw, 17vw"
              }
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground/45">
              <ImageIcon className="size-10" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <span className="rounded-md border border-white/15 bg-black/62 px-2 py-1 font-mono text-[0.65rem] font-semibold text-white backdrop-blur-md">
              {labels("number", { number: String(card.number).padStart(3, "0") })}
            </span>
            <div className="flex flex-wrap justify-end gap-1">
              {card.isCommander ? <span className="rounded-full bg-safir px-2 py-1 text-[0.6rem] font-semibold text-white shadow-sm">{labels("commander")}</span> : null}
              {card.isPromo ? <span className="rounded-full border border-white/25 bg-black/55 px-2 py-1 text-[0.6rem] font-semibold text-white backdrop-blur-md">{labels("promo")}</span> : null}
            </div>
          </div>
        </div>
        <div className="p-3 transition group-hover/artwork:bg-muted/15 sm:p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-heading text-sm font-semibold tracking-[-0.02em] sm:text-base">
                {card.name}
              </h2>
              <p className="mt-1 truncate text-[0.68rem] text-muted-foreground">
                {[card.season?.name, card.set?.name].filter(Boolean).join(" · ") || labels("unknownRelation")}
              </p>
            </div>
            {card.rarity ? (
              <span
                className="mt-1 size-2.5 shrink-0 rounded-full ring-3 ring-current/10"
                style={{ color: card.rarity.color, backgroundColor: card.rarity.color ?? "currentColor" }}
                title={card.rarity.name}
              />
            ) : null}
          </div>
        </div>
      </Link>
      {collectionEntry && card.collectible ? (
        <div className="mt-auto">
          <CollectionQuantityControls cardId={card.id} cardName={card.name} initialEntry={collectionEntry} compact compactVariant="catalogue" onChange={onCollectionChange} />
        </div>
      ) : null}
    </article>
  );
}
