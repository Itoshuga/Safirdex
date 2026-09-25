import { ArrowLeft, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { GlossaryText } from "@/components/cards/glossary-text";
import { Badge } from "@/components/ui/badge";
import type { CardDetailItem } from "@/features/cards/types";
import { Link } from "@/i18n/navigation";

function Artwork({
  url,
  alt,
  orientation,
  priority = false,
}: {
  url?: string;
  alt: string;
  orientation: "vertical" | "horizontal";
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[5/7] overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_50%_25%,color-mix(in_oklch,var(--safir)_15%,transparent),transparent_62%)]">
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          priority={priority}
          className={orientation === "horizontal" ? "object-contain p-4" : "object-cover"}
          sizes="(max-width: 767px) 100vw, 42vw"
        />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground/45">
          <ImageIcon className="size-14" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export function CardDetail({ card }: { card: CardDetailItem }) {
  const labels = useTranslations("Cards.labels");
  const stats = useTranslations("Cards.stats");
  const detail = useTranslations("Cards.detail");

  return (
    <main className="site-container py-8 sm:py-12">
      <Link href="/cards" className="mb-7 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" /> {detail("back")}
      </Link>
      <article className="grid gap-8 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <div className="mx-auto w-full max-w-[34rem]">
          <Artwork {...card.artwork} priority />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-safir">
              {labels("number", { number: String(card.number).padStart(3, "0") })}
            </span>
            {card.isCommander ? <Badge>{labels("commander")}</Badge> : null}
            {card.isPromo ? <Badge variant="outline">{labels("promo")}</Badge> : null}
          </div>
          <h1 className="mt-3 font-heading text-4xl leading-[0.95] font-semibold tracking-[-0.055em] sm:text-6xl">
            {card.name}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            {card.season ? <Badge variant="secondary">{card.season.name}</Badge> : null}
            {card.set ? <Badge variant="secondary">{card.set.name}</Badge> : null}
            {card.rarity ? (
              <Badge variant="outline" style={{ borderColor: card.rarity.color, color: card.rarity.color }}>
                {card.rarity.name}
              </Badge>
            ) : null}
            {card.types.map((type) => <Badge key={type.id} variant="outline">{type.name}</Badge>)}
          </div>
          <dl className="mt-8 grid max-w-lg grid-cols-3 divide-x rounded-2xl border bg-card py-4">
            {[
              [stats("attack"), stats("attackShort"), card.attack],
              [stats("value"), stats("valueShort"), card.value],
              [stats("defense"), stats("defenseShort"), card.defense],
            ].map(([label, short, value]) => (
              <div key={label} className="px-4 text-center">
                <dt className="text-[0.62rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase" title={String(label)}>{short}</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <section className="mt-9 border-t pt-7">
            <h2 className="font-heading text-xl font-semibold">{labels("description")}</h2>
            <div className="mt-3">
              {card.description ? (
                <GlossaryText content={card.description} glossary={card.glossary} />
              ) : (
                <p className="text-sm text-muted-foreground">{detail("noDescription")}</p>
              )}
            </div>
          </section>
        </div>
      </article>
      {card.alternativeArtworks.length ? (
        <section className="mt-16 border-t pt-10">
          <p className="eyebrow">{detail("gallery")}</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em]">{labels("alternativeArtworks")}</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {card.alternativeArtworks.map((artwork) => (
              <figure key={artwork.id}>
                <Artwork {...artwork} />
                <figcaption className="mt-2 text-xs text-muted-foreground">{artwork.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
