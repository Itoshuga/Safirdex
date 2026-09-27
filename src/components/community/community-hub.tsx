import { Compass, LogIn, Sparkles, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { CommunityDeckGallery } from "@/components/community/community-deck-gallery";
import { CommunityFeed } from "@/components/community/community-feed";
import { CommunityHeader } from "@/components/community/community-header";
import { CommunityPeopleSuggestions } from "@/components/community/community-people-suggestions";
import { CommunityPostComposer } from "@/components/community/community-post-composer";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import type {
  CommunityDeckItem,
  CommunityFeedPage,
  CommunityUserResult,
  ActivityActorSnapshot,
} from "@/features/community/types";
import { Link } from "@/i18n/navigation";

function FeedEmpty({ mode }: { mode: "discover" | "following" }) {
  const t = useTranslations("Community.feed");
  const Icon = mode === "discover" ? Sparkles : Users;

  return (
    <div className="rounded-3xl border border-dashed px-6 py-16 text-center sm:py-20">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-heading text-2xl font-semibold">
        {t(`empty.${mode}.title`)}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {t(`empty.${mode}.description`)}
      </p>
      <Button
        className="mt-6 rounded-full"
        nativeButton={false}
        render={<Link href={mode === "following" ? "/community/people" : "/decks/new"} />}
      >
        {mode === "following" ? t("discoverPeople") : t("createDeck")}
      </Button>
    </div>
  );
}

function SignedOutFollowing() {
  const t = useTranslations("Community.feed.signedOut");

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-muted/25 px-6 py-16 text-center sm:px-10 sm:py-20">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
      <div className="relative">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-background text-safir shadow-sm">
          <LogIn className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-heading text-2xl font-semibold">{t("title")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
        <Button className="mt-6 rounded-full" nativeButton={false} render={<Link href="/login" />}>
          {t("action")}
        </Button>
      </div>
    </div>
  );
}

export function CommunityHub({
  mode,
  people,
  recentDecks,
  feed,
  signedIn,
  viewerId,
  viewer,
  locale,
}: {
  mode: "discover" | "following";
  people: CommunityUserResult[];
  recentDecks: CommunityDeckItem[];
  feed: CommunityFeedPage;
  signedIn: boolean;
  viewerId: string | null;
  viewer: ActivityActorSnapshot | null;
  locale: string;
}) {
  const t = useTranslations("Community.feed");

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <CommunityHeader active={mode} />
        <div className="site-container py-8 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.62fr)_minmax(19rem,0.72fr)] lg:items-start xl:gap-14">
            <aside className="order-1 min-w-0 space-y-9 lg:order-2 lg:sticky lg:top-6">
              <CommunityPeopleSuggestions people={people} signedIn={signedIn} />
              <div className="hidden lg:block">
                <CommunityDeckGallery decks={recentDecks} />
              </div>
            </aside>

            <section className="order-2 min-w-0 lg:order-1" aria-labelledby="community-feed-title">
              <div className="mb-6 flex items-end justify-between gap-4 border-b pb-4">
                <div>
                  <p className="eyebrow">
                    {mode === "discover" ? t("discoverEyebrow") : t("followingEyebrow")}
                  </p>
                  <h2 id="community-feed-title" className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
                    {mode === "discover" ? t("discoverTitle") : t("followingTitle")}
                  </h2>
                </div>
                <Compass className="size-5 text-safir" aria-hidden="true" />
              </div>

              {signedIn && viewer ? <CommunityPostComposer viewer={viewer} locale={locale} /> : null}

              {mode === "following" && !signedIn ? (
                <SignedOutFollowing />
              ) : feed.items.length ? (
                <CommunityFeed
                  key={`${mode}:${feed.items.map((item) => item.id).join(",")}`}
                  initialFeed={feed}
                  mode={mode}
                  locale={locale}
                  viewerId={viewerId}
                />
              ) : (
                <FeedEmpty mode={mode} />
              )}

              <div className="mt-12 lg:hidden">
                <CommunityDeckGallery decks={recentDecks} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
