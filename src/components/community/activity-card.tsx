import { Layers3, RefreshCw, Sparkles } from "lucide-react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";

import { ProfileAvatar } from "@/components/community/profile-avatar";
import type {
  CollectionActivityPayload,
  CommunityActivityItem,
  DeckActivityPayload,
} from "@/features/community/types";
import { Link } from "@/i18n/navigation";
import { getLocalizedName } from "@/lib/i18n/get-localized-value";

type LocalizedCollectionPayload = Extract<CommunityActivityItem["payload"], { addedCount: number }>;

function DeckPreview({ payload }: { payload: DeckActivityPayload }) {
  const t = useTranslations("Community.activity");
  const locale = useLocale();
  const artwork = payload.deck.commander?.artworkUrl ?? payload.deck.coverCard?.artworkUrl;
  const commander = payload.deck.commander
    ? getLocalizedName(payload.deck.commander.translations, locale)
    : undefined;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border bg-background">
      <div className="grid min-h-40 sm:grid-cols-[12rem_1fr]">
        <div className="relative min-h-40 bg-muted">
          {artwork ? <Image src={artwork} alt="" fill sizes="192px" className="object-cover" /> : null}
        </div>
        <div className="flex flex-col justify-between p-5">
          <div>
            <p className="eyebrow">{t("deckPreview")}</p>
            <h3 className="mt-3 font-heading text-xl font-semibold">{payload.deck.name}</h3>
            {commander ? <p className="mt-1 text-xs text-muted-foreground">{t("commander", { name: commander })}</p> : null}
          </div>
          <p className="mt-5 font-mono text-xs font-semibold text-safir">
            {t("cardCount", { count: payload.deck.cardCount })}
          </p>
        </div>
      </div>
    </div>
  );
}

function CollectionPreview({ payload }: { payload: LocalizedCollectionPayload }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {payload.cards.map((card) => (
        <Link key={card.cardId} href={`/cards/${card.slug}`} className="group relative aspect-[5/7] overflow-hidden rounded-xl border bg-muted">
          {card.artworkUrl ? <Image src={card.artworkUrl} alt={card.name} fill sizes="(max-width: 639px) 50vw, 12rem" className="object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 text-xs font-semibold text-white">
            {card.name}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function ActivityCard({ activity }: { activity: CommunityActivityItem }) {
  const t = useTranslations("Community.activity");
  const format = useFormatter();
  const date = new Date(activity.createdAtIso);
  const payload = activity.payload;
  const isCollection = activity.type === "collection_updated";
  const message = isCollection
    ? t("collectionUpdated", {
        user: activity.actor.displayName,
        count: (payload as CollectionActivityPayload).addedCount,
      })
    : activity.type === "deck_updated"
      ? t("deckUpdated", { user: activity.actor.displayName })
      : t("deckCreated", { user: activity.actor.displayName });

  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <Link href={`/user/@${activity.actor.username}`}>
          <ProfileAvatar src={activity.actor.avatarUrl} name={activity.actor.displayName} className="size-11 border-2" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/user/@${activity.actor.username}`} className="truncate text-sm font-semibold hover:text-safir">
            {activity.actor.displayName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{activity.actor.username} · <time dateTime={activity.createdAtIso}>{format.relativeTime(date)}</time>
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-lg bg-safir/10 text-safir">
          {isCollection ? <Layers3 className="size-4" /> : activity.type === "deck_updated" ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}
        </span>
      </header>
      <p className="mt-4 text-sm leading-6">{message}</p>
      {isCollection ? (
        <CollectionPreview payload={payload as LocalizedCollectionPayload} />
      ) : (
        <DeckPreview payload={payload as DeckActivityPayload} />
      )}
    </article>
  );
}
