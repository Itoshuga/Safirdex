import { Activity, Layers3, Library, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { ActivityCard } from "@/components/community/activity-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProfileTabContent } from "@/features/community/types";
import { Link } from "@/i18n/navigation";

function EmptySection({ icon: Icon, title, description }: { icon: typeof Activity; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground/50" />
      <h2 className="mt-4 font-heading text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function ProfileTabContentView({
  content,
  basePath,
}: {
  content: ProfileTabContent;
  basePath: string;
}) {
  const t = useTranslations("Profile.sections");
  const tFeed = useTranslations("Community.feed");
  const deckStatus = useTranslations("Decks.status");
  if (content.tab === "overview") {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {(["decks", "collection", "activity"] as const).map((section) => {
          const Icon = section === "decks" ? Layers3 : section === "collection" ? Library : Activity;
          return (
            <div key={section} className="rounded-2xl border bg-card p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-safir/10 text-safir"><Icon className="size-4" /></span>
              <h2 className="mt-4 font-heading text-lg font-semibold">{t(`${section}.title`)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`${section}.overview`)}</p>
            </div>
          );
        })}
      </div>
    );
  }
  if (content.private) {
    return <EmptySection icon={LockKeyhole} title={t("privateTitle")} description={t("privateDescription")} />;
  }
  if (content.tab === "decks") {
    if (!content.items.length) return <EmptySection icon={Layers3} title={t("decks.emptyTitle")} description={t("decks.emptyDescription")} />;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.items.map((deck) => (
          <Link key={deck.id} href={`/decks/${deck.id}`} className="overflow-hidden rounded-2xl border bg-card transition hover:border-safir/40 hover:shadow-md">
            <div className="relative aspect-[16/9] bg-muted">
              {deck.artworkUrl ? <Image src={deck.artworkUrl} alt="" fill sizes="(max-width: 1023px) 50vw, 33vw" className="object-cover" /> : null}
            </div>
            <div className="p-4">
              <h2 className="font-heading text-lg font-semibold">{deck.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("decks.cardCount", { count: deck.cardCount })}</p>
              {deck.commanderName ? <Badge variant="secondary" className="mt-3">{deck.commanderName}</Badge> : null}
              {deck.status ? <Badge variant="outline" className="mt-3 ml-2">{deckStatus(deck.status)}</Badge> : null}
              {deck.visibility ? <Badge variant="outline" className="mt-3 ml-2">{deckStatus(deck.visibility)}</Badge> : null}
            </div>
          </Link>
        ))}
      </div>
    );
  }
  if (content.tab === "collection") {
    if (!content.items.length) return <EmptySection icon={Library} title={t("collection.emptyTitle")} description={t("collection.emptyDescription")} />;
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {content.items.map((card) => (
          <Link key={card.cardId} href={`/cards/${card.slug}`} className="group overflow-hidden rounded-xl border bg-card">
            <div className={`relative ${card.orientation === "horizontal" ? "aspect-[3/2]" : "aspect-[5/7]"} overflow-hidden bg-muted`}>
              {card.artworkUrl ? <Image src={card.artworkUrl} alt={card.name} fill sizes="(max-width: 639px) 50vw, 16vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="truncate text-xs font-semibold">{card.name}</span>
              <Badge variant="secondary">×{card.quantity}</Badge>
            </div>
          </Link>
        ))}
      </div>
    );
  }
  if (!content.feed.items.length) return <EmptySection icon={Activity} title={t("activity.emptyTitle")} description={t("activity.emptyDescription")} />;
  return (
    <div className="space-y-4">
      {content.feed.items.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
      {content.feed.nextCursor ? (
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href={`${basePath}?tab=activity&cursor=${encodeURIComponent(content.feed.nextCursor)}`} />}
        >
          {tFeed("loadMore")}
        </Button>
      ) : null}
    </div>
  );
}
