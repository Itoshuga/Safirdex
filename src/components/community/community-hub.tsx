import { Compass, SearchX, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { ActivityCard } from "@/components/community/activity-card";
import { CommunitySearch } from "@/components/community/community-search";
import { UserCard } from "@/components/community/user-card";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import type { CommunityFeedPage, CommunityUserResult } from "@/features/community/types";
import { Link } from "@/i18n/navigation";

export function CommunityHub({
  mode,
  query,
  people,
  feed,
  signedIn,
}: {
  mode: "discover" | "following";
  query: string;
  people: CommunityUserResult[];
  feed: CommunityFeedPage;
  signedIn: boolean;
}) {
  const t = useTranslations("Community");
  const modeHref = (nextMode: "discover" | "following") =>
    `/community?feed=${nextMode}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
  const nextHref = feed.nextCursor
    ? `/community?feed=${mode}${query ? `&q=${encodeURIComponent(query)}` : ""}&cursor=${encodeURIComponent(feed.nextCursor)}`
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b bg-[linear-gradient(180deg,color-mix(in_oklch,var(--safir)_8%,var(--background)),var(--background))]">
          <div className="site-container py-12 sm:py-16">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">{t("title")}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{t("description")}</p>
            <div className="mt-7 max-w-2xl"><CommunitySearch initialQuery={query} /></div>
          </div>
        </section>

        <div className="site-container py-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-start">
            <section>
              <div className="mb-5 flex items-center justify-between gap-4 border-b">
                <div className="flex">
                  {(["discover", "following"] as const).map((entry) => (
                    <Link
                      key={entry}
                      href={!signedIn && entry === "following" ? "/login" : modeHref(entry)}
                      className={`relative px-4 py-3 text-sm font-semibold ${mode === entry ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-safir" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {t(`feed.${entry}`)}
                    </Link>
                  ))}
                </div>
              </div>
              {feed.items.length ? (
                <div className="space-y-4">
                  {feed.items.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
                  {nextHref ? <Button variant="outline" size="lg" className="w-full" nativeButton={false} render={<Link href={nextHref} />}>{t("feed.loadMore")}</Button> : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed px-6 py-20 text-center">
                  <Compass className="mx-auto size-9 text-muted-foreground/50" />
                  <h2 className="mt-4 font-heading text-xl font-semibold">{t(`feed.empty.${mode}.title`)}</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t(`feed.empty.${mode}.description`)}</p>
                  {mode === "following" ? <Button className="mt-6" nativeButton={false} render={<Link href="/community?feed=discover" />}>{t("feed.discoverPeople")}</Button> : null}
                </div>
              )}
            </section>

            <aside className="lg:sticky lg:top-6">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">{query ? t("people.resultsEyebrow") : t("people.discoverEyebrow")}</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">{query ? t("people.results", { query }) : t("people.discover")}</h2>
                </div>
                <Users className="size-5 text-safir" />
              </div>
              {people.length ? (
                <div className="space-y-3">{people.map((user) => <UserCard key={user.username} user={user} signedIn={signedIn} />)}</div>
              ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  <SearchX className="mx-auto size-7 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">{query ? t("people.noResults") : t("people.empty")}</p>
                </div>
              )}
              <p className="mt-4 text-[0.68rem] leading-5 text-muted-foreground">{t("search.limitNote")}</p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
