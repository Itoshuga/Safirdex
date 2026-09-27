import { Crown, Layers3 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import type { DeckActivityPayload } from "@/features/community/types";
import { Link } from "@/i18n/navigation";
import { getLocalizedName } from "@/lib/i18n/get-localized-value";

export function CommunityDeckPreview({
  payload,
}: {
  payload: DeckActivityPayload;
}) {
  const t = useTranslations("Community.activity");
  const locale = useLocale();
  const artwork =
    payload.deck.commander?.artworkUrl ?? payload.deck.coverCard?.artworkUrl;
  const commander = payload.deck.commander
    ? getLocalizedName(payload.deck.commander.translations, locale)
    : undefined;

  return (
    <Link
      href={`/decks/${payload.deckId}`}
      prefetch={false}
      className="group mt-4 block overflow-hidden rounded-2xl bg-muted outline-none ring-safir/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 focus-visible:ring-2"
    >
      <div className="relative aspect-[16/9] min-h-48 overflow-hidden sm:aspect-[2/1]">
        {artwork ? (
          <Image
            src={artwork}
            alt={payload.deck.name}
            fill
            sizes="(max-width: 1023px) 100vw, 46rem"
            className="object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="surface-grid absolute inset-0 grid place-items-center text-safir/35">
            <Layers3 className="size-14" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
          <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-white/65 uppercase">
            {t("deckPreview")}
          </p>
          <h3 className="mt-1.5 font-heading text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            {payload.deck.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/75">
            {commander ? (
              <span className="inline-flex items-center gap-1.5">
                <Crown className="size-3.5" aria-hidden="true" />
                {commander}
              </span>
            ) : null}
            <span>{t("cardCount", { count: payload.deck.cardCount })}</span>
          </div>
          {payload.deck.factions?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {payload.deck.factions.slice(0, 3).map((faction) => (
                <span
                  key={faction.id}
                  className="rounded-full border border-white/20 bg-black/25 px-2 py-1 text-[0.62rem] font-semibold backdrop-blur"
                  style={faction.color ? { borderColor: faction.color } : undefined}
                >
                  {getLocalizedName(faction.translations, locale)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
