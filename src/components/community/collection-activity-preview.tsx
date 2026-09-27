import Image from "next/image";
import { useTranslations } from "next-intl";

import type { CommunityActivityItem } from "@/features/community/types";
import { Link } from "@/i18n/navigation";

type Payload = Extract<CommunityActivityItem["payload"], { addedCount: number }>;

export function CollectionActivityPreview({ payload }: { payload: Payload }) {
  const t = useTranslations("Community.activity");
  const remaining = Math.max(0, payload.addedCount - payload.cards.length);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {payload.cards.map((card) => (
          <Link
            key={card.cardId}
            href={`/cards/${card.slug}`}
            aria-label={card.name}
            className="group relative aspect-[5/7] overflow-hidden rounded-lg bg-muted outline-none ring-safir/40 focus-visible:ring-2 sm:rounded-xl"
          >
            {card.artworkUrl ? (
              <Image
                src={card.artworkUrl}
                alt={card.name}
                fill
                sizes="(max-width: 639px) 25vw, 11rem"
                className="object-cover transition duration-300 group-hover:scale-[1.035]"
              />
            ) : (
              <div className="surface-grid absolute inset-0 opacity-40" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-8 pb-2 text-[0.62rem] font-semibold text-white sm:px-3 sm:text-xs">
              <span className="line-clamp-2">{card.name}</span>
            </div>
          </Link>
        ))}
      </div>
      {remaining ? (
        <p className="mt-2 text-right text-xs font-medium text-muted-foreground">
          {t("moreCards", { count: remaining })}
        </p>
      ) : null}
    </div>
  );
}
