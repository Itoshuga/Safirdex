import { Activity, ArrowRight, Layers3, Library, LockKeyhole, Plus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { CommunityFeedItemCard } from "@/components/community/community-feed-item-card";
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

function OverviewEmptySection({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-muted/35 px-6 py-10 text-center sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--safir)_12%,transparent),transparent_58%)]" />
      <div className="relative">
        <span className="mx-auto grid size-11 place-items-center rounded-full border bg-background/75 text-muted-foreground shadow-sm">
          <Icon className="size-5" />
        </span>
        <h3 className="mt-4 font-heading text-lg font-semibold">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}

export function ProfileTabContentView({
  content,
  basePath,
  owner,
}: {
  content: ProfileTabContent;
  basePath: string;
  owner: boolean;
}) {
  const t = useTranslations("Profile.sections");
  const tFeed = useTranslations("Community.feed");
  const tCollection = useTranslations("Collection.filters");
  const tCollectionStats = useTranslations("Collection.stats");
  const deckStatus = useTranslations("Decks.status");
  if (content.tab === "overview") {
    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[1.75rem] border bg-card/55 shadow-[0_1px_0_0_color-mix(in_oklch,var(--foreground)_3%,transparent)]">
          <header className="flex items-center gap-4 px-5 py-5 sm:px-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-safir/10 text-safir">
              <Layers3 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-semibold sm:text-2xl">{t("decks.overview")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("decks.overviewDescription")}</p>
            </div>
            <Link
              href={`${basePath}?tab=decks`}
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <span className="hidden sm:inline">{t("viewAll")}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </header>
          <div className="border-t p-3 sm:p-5">
            {content.decksPrivate ? (
              <OverviewEmptySection icon={LockKeyhole} title={t("privateTitle")} description={t("privateDescription")} />
            ) : content.decks.length ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
                {content.decks.map((deck) => (
                  <Link key={deck.id} href={`/decks/${deck.id}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted transition duration-300 hover:-translate-y-0.5 hover:border-safir/35 hover:shadow-xl hover:shadow-black/10 sm:aspect-[16/11]">
                    {deck.artworkUrl ? (
                      <Image src={deck.artworkUrl} alt="" fill sizes="(max-width: 639px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                    ) : (
                      <>
                        <div className="surface-grid absolute inset-0 opacity-35" />
                        <Layers3 className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30" />
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/5" />
                    <span className="absolute top-2.5 right-2.5 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[0.58rem] font-semibold text-white backdrop-blur-md sm:top-3 sm:right-3 sm:text-[0.65rem]">{t("decks.cardCount", { count: deck.cardCount })}</span>
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                      <h3 className="truncate font-heading text-sm font-semibold sm:text-base">{deck.name}</h3>
                      {deck.commanderName ? <p className="mt-0.5 truncate text-[0.65rem] text-white/70 sm:text-xs">{deck.commanderName}</p> : null}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <OverviewEmptySection
                icon={Layers3}
                title={t(owner ? "decks.ownerEmptyTitle" : "decks.emptyTitle")}
                description={t(owner ? "decks.ownerEmptyDescription" : "decks.emptyDescription")}
                action={owner ? (
                  <Button className="mt-5 rounded-full px-4" nativeButton={false} render={<Link href="/decks/new" />}>
                    <Plus aria-hidden="true" /> {t("decks.create")}
                  </Button>
                ) : undefined}
              />
            )}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]">
          <Link
            href={`${basePath}?tab=collection`}
            className="group relative min-h-60 overflow-hidden rounded-[1.75rem] border bg-card/55 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-safir/30 hover:shadow-xl hover:shadow-black/5"
          >
            <div className="pointer-events-none absolute -right-16 -bottom-20 size-56 rounded-full bg-safir/10 blur-3xl transition group-hover:bg-safir/15" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-safir/10 text-safir">
                  {content.collectionPrivate ? <LockKeyhole className="size-5" /> : <Library className="size-5" />}
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
              </div>
              <div className="mt-auto pt-10">
                <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">{t("collection.overview")}</p>
                {content.collectionPrivate ? (
                  <>
                    <h2 className="mt-3 font-heading text-2xl font-semibold">{t("privateTitle")}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("privateDescription")}</p>
                  </>
                ) : (
                  <>
                    <div className="mt-3 flex items-end gap-3">
                      <strong className="font-heading text-5xl font-semibold tracking-tight">{content.collectionCount}</strong>
                      <span className="pb-1 text-sm text-muted-foreground">{t("collection.unit", { count: content.collectionCount })}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{t("collection.overviewDescription")}</p>
                    <p className="mt-1 text-xs font-semibold text-safir">{tCollectionStats("completion", { percentage: Math.round(content.collectionCompletionPercentage * 10) / 10 })}</p>
                  </>
                )}
              </div>
            </div>
          </Link>

          <section className="overflow-hidden rounded-[1.75rem] border bg-card/55">
            <header className="flex items-center gap-4 border-b px-5 py-5 sm:px-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-safir/10 text-safir">
                <Activity className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl font-semibold">{t("activity.overview")}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{t("activity.overviewDescription")}</p>
              </div>
              <Link
                href={`${basePath}?tab=activity`}
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <span className="hidden sm:inline">{t("viewAll")}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </header>
            <div className="px-5 py-5 sm:px-6">
              {content.activityPrivate ? (
                <OverviewEmptySection icon={LockKeyhole} title={t("privateTitle")} description={t("privateDescription")} />
              ) : content.feed.items.length ? (
                <div className="divide-y">
                  {content.feed.items.map((item) => <CommunityFeedItemCard key={item.id} item={item} compact />)}
                </div>
              ) : (
                <OverviewEmptySection icon={Activity} title={t("activity.emptyTitle")} description={t(owner ? "activity.ownerEmptyDescription" : "activity.emptyDescription")} />
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }
  if (content.private) {
    return content.tab === "collection" ? (
      <div className="space-y-4">
        <CollectionProfileFilters basePath={basePath} active={content.filter} allLabel={tCollection("all")} tradesLabel={tCollection("trades")} />
        <EmptySection icon={LockKeyhole} title={t("privateTitle")} description={t("privateDescription")} />
      </div>
    ) : <EmptySection icon={LockKeyhole} title={t("privateTitle")} description={t("privateDescription")} />;
  }
  if (content.tab === "decks") {
    if (!content.items.length) return <EmptySection icon={Layers3} title={t("decks.emptyTitle")} description={t("decks.emptyDescription")} />;
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {content.items.map((deck) => (
          <Link key={deck.id} href={`/decks/${deck.id}`} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted transition hover:-translate-y-0.5 hover:border-safir/40 hover:shadow-lg sm:rounded-2xl">
            {deck.artworkUrl ? <Image src={deck.artworkUrl} alt="" fill sizes="(max-width: 639px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="surface-grid absolute inset-0 opacity-30" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/15" />
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 sm:top-3 sm:left-3">
              {deck.status ? <Badge className="border-white/15 bg-black/45 text-[0.58rem] text-white backdrop-blur-md">{deckStatus(deck.status)}</Badge> : null}
              {deck.visibility ? <Badge className="border-white/15 bg-black/45 text-[0.58rem] text-white backdrop-blur-md">{deckStatus(deck.visibility)}</Badge> : null}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
              <h2 className="truncate font-heading text-base font-semibold sm:text-lg">{deck.name}</h2>
              <div className="mt-1 flex items-center justify-between gap-2 text-[0.65rem] text-white/70 sm:text-xs">
                <span className="truncate">{deck.commanderName ?? t("decks.overview")}</span>
                <span className="shrink-0">{t("decks.cardCount", { count: deck.cardCount })}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }
  if (content.tab === "collection") {
    if (!content.items.length) return <div className="space-y-4"><CollectionProfileFilters basePath={basePath} active={content.filter} allLabel={tCollection("all")} tradesLabel={tCollection("trades")} /><EmptySection icon={Library} title={t("collection.emptyTitle")} description={t("collection.emptyDescription")} /></div>;
    return (
      <div className="space-y-4">
        <CollectionProfileFilters basePath={basePath} active={content.filter} allLabel={tCollection("all")} tradesLabel={tCollection("trades")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {content.items.map((card) => (
          <Link key={card.cardId} href={`/cards/${card.slug}`} className="group overflow-hidden rounded-xl border bg-card">
            <div className={`relative ${card.orientation === "horizontal" ? "aspect-[3/2]" : "aspect-[5/7]"} overflow-hidden bg-muted`}>
              {card.artworkUrl ? <Image src={card.artworkUrl} alt={card.name} fill sizes="(max-width: 639px) 50vw, 16vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <span className="truncate text-xs font-semibold">{card.name}</span>
              <span className="flex shrink-0 gap-1">
                <Badge variant="secondary">×{card.ownedQuantity}</Badge>
                {card.tradeQuantity > 0 ? <Badge>↔ {card.tradeQuantity}</Badge> : null}
              </span>
            </div>
          </Link>
          ))}
        </div>
      </div>
    );
  }
  if (!content.feed.items.length) return <EmptySection icon={Activity} title={t("activity.emptyTitle")} description={t("activity.emptyDescription")} />;
  return (
    <div className="space-y-4">
      {content.feed.items.map((item) => <CommunityFeedItemCard key={item.id} item={item} />)}
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

function CollectionProfileFilters({ basePath, active, allLabel, tradesLabel }: { basePath: string; active: "all" | "trades"; allLabel: string; tradesLabel: string }) {
  return (
    <div className="flex w-fit rounded-xl border bg-card p-1">
      <Button size="sm" variant={active === "all" ? "secondary" : "ghost"} nativeButton={false} render={<Link href={`${basePath}?tab=collection`} />}>{allLabel}</Button>
      <Button size="sm" variant={active === "trades" ? "secondary" : "ghost"} nativeButton={false} render={<Link href={`${basePath}?tab=collection&filter=trades`} />}>{tradesLabel}</Button>
    </div>
  );
}
