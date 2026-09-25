import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { CardListItem } from "@/features/cards/types";
import { Link } from "@/i18n/navigation";

export function CardListRow({ card }: { card: CardListItem }) {
  const labels = useTranslations("Cards.labels");
  const stats = useTranslations("Cards.stats");

  return (
    <article>
      <Link
        href={`/cards/${card.slug}`}
        prefetch={false}
        className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border bg-card p-2.5 transition hover:border-safir/40 hover:bg-muted/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[4.25rem_minmax(0,1fr)_auto] sm:gap-4 sm:p-3"
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
            {[card.season?.name, card.set?.name, card.rarity?.name].filter(Boolean).join(" · ") || labels("unknownRelation")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {card.types.map((type) => <Badge key={type.id} variant="secondary" className="text-[0.6rem]">{type.name}</Badge>)}
            {card.isCommander ? <Badge className="text-[0.6rem]">{labels("commander")}</Badge> : null}
            {card.isPromo ? <Badge variant="outline" className="text-[0.6rem]">{labels("promo")}</Badge> : null}
          </div>
        </div>

        <dl className="col-span-2 grid grid-cols-3 divide-x rounded-lg border bg-background/60 py-2 sm:col-span-1 sm:min-w-56">
          {[
            [stats("attackShort"), card.attack],
            [stats("valueShort"), card.value],
            [stats("defenseShort"), card.defense],
          ].map(([label, value]) => (
            <div key={label} className="px-3 text-center">
              <dt className="text-[0.55rem] font-semibold tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Link>
    </article>
  );
}
