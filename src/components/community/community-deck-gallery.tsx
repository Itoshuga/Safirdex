import { ArrowRight, Crown, Layers3 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import type { CommunityDeckItem } from "@/features/community/types";
import { Link } from "@/i18n/navigation";

export function CommunityDeckGallery({ decks }: { decks: CommunityDeckItem[] }) {
  const t = useTranslations("Community.decks");

  if (!decks.length) return null;

  return (
    <section aria-labelledby="community-decks-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 id="community-decks-title" className="mt-2 font-heading text-xl font-semibold">
            {t("title")}
          </h2>
        </div>
        <Link href="/decks" className="inline-flex items-center gap-1 text-xs font-semibold text-safir hover:underline">
          {t("viewAll")}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {decks.slice(0, 5).map((deck, index) => (
          <Link
            key={deck.id}
            href={`/decks/${deck.id}`}
            prefetch={false}
            className={`group relative overflow-hidden rounded-2xl bg-muted outline-none ring-safir/40 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 ${
              index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"
            }`}
          >
            {deck.artworkUrl ? (
              <Image
                src={deck.artworkUrl}
                alt={deck.name}
                fill
                sizes={index === 0 ? "22rem" : "11rem"}
                className="object-cover transition duration-500 group-hover:scale-[1.035]"
              />
            ) : (
              <div className="surface-grid absolute inset-0 grid place-items-center text-muted-foreground/35">
                <Layers3 className="size-8" aria-hidden="true" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
              <h3 className={`truncate font-heading font-semibold ${index === 0 ? "text-lg" : "text-sm"}`}>
                {deck.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 truncate text-[0.62rem] text-white/70">
                {deck.commanderName ? <Crown className="size-3 shrink-0" aria-hidden="true" /> : null}
                {deck.commanderName ?? t("cards", { count: deck.cardCount })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
