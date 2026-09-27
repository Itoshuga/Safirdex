import { Layers3, RefreshCw, Sparkles } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { CollectionActivityPreview } from "@/components/community/collection-activity-preview";
import { CommunityDeckPreview } from "@/components/community/community-deck-preview";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import type {
  CollectionActivityPayload,
  CommunityActivityItem,
  DeckActivityPayload,
} from "@/features/community/types";
import { Link } from "@/i18n/navigation";

type LocalizedCollectionPayload = Extract<
  CommunityActivityItem["payload"],
  { addedCount: number }
>;

export function ActivityCard({
  activity,
  compact = false,
  viewerId,
}: {
  activity: CommunityActivityItem;
  compact?: boolean;
  viewerId?: string | null;
}) {
  const t = useTranslations("Community.activity");
  const format = useFormatter();
  const date = new Date(activity.createdAtIso);
  const payload = activity.payload;
  const isCollection = activity.type === "collection_updated";
  const profileHref =
    viewerId && activity.actor.userId === viewerId
      ? "/account"
      : `/user/@${activity.actor.username}`;
  const message = isCollection
    ? t("collectionUpdated", {
        user: activity.actor.displayName,
        count: (payload as CollectionActivityPayload).addedCount,
      })
    : activity.type === "deck_updated"
      ? t("deckUpdated", { user: activity.actor.displayName })
      : t("deckCreated", { user: activity.actor.displayName });

  const activityIcon = isCollection ? (
    <Layers3 className="size-3.5" aria-hidden="true" />
  ) : activity.type === "deck_updated" ? (
    <RefreshCw className="size-3.5" aria-hidden="true" />
  ) : (
    <Sparkles className="size-3.5" aria-hidden="true" />
  );

  if (compact) {
    return (
      <article className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
        <Link href={profileHref} className="shrink-0">
          <ProfileAvatar
            src={activity.actor.avatarUrl}
            name={activity.actor.displayName}
            className="size-10 border-2"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <time dateTime={activity.createdAtIso}>{format.relativeTime(date)}</time>
          </p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-safir/10 text-safir">
          {activityIcon}
        </span>
      </article>
    );
  }

  return (
    <article className="border-b border-border/65 pb-8 last:border-0 last:pb-0">
      <header className="flex items-center gap-3">
        <Link href={profileHref} className="shrink-0 rounded-full outline-none ring-safir/40 focus-visible:ring-2">
          <ProfileAvatar
            src={activity.actor.avatarUrl}
            name={activity.actor.displayName}
            className="size-11 border-2 sm:size-12"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={profileHref} className="block truncate text-sm font-semibold hover:text-safir">
            {activity.actor.displayName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{activity.actor.username}
            <span aria-hidden="true"> · </span>
            <time dateTime={activity.createdAtIso}>{format.relativeTime(date)}</time>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-safir/8 px-2.5 py-1 text-[0.65rem] font-semibold text-safir">
          {activityIcon}
          {t(`types.${activity.type}`)}
        </span>
      </header>
      <p className="mt-4 text-sm leading-6 text-foreground/90">{message}</p>
      {isCollection ? (
        <CollectionActivityPreview payload={payload as LocalizedCollectionPayload} />
      ) : (
        <CommunityDeckPreview payload={payload as DeckActivityPayload} />
      )}
    </article>
  );
}
