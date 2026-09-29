import {
  Activity,
  CalendarDays,
  Edit3,
  Grid2X2,
  Layers3,
  Library,
  Settings,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { FollowButton } from "@/components/community/follow-button";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import { ShareProfileButton } from "@/components/community/share-profile-button";
import { Button } from "@/components/ui/button";
import type {
  ProfileTab,
  ProfileViewerState,
  PublicProfileView,
} from "@/features/community/types";
import { Link } from "@/i18n/navigation";

const tabNames: ProfileTab[] = ["overview", "decks", "collection", "activity"];
const tabIcons = {
  overview: Grid2X2,
  decks: Layers3,
  collection: Library,
  activity: Activity,
} satisfies Record<ProfileTab, typeof Grid2X2>;

export function ProfileHeader({
  profile,
  viewer,
  mode,
  activeTab,
  basePath,
}: {
  profile: PublicProfileView;
  viewer: ProfileViewerState;
  mode: "owner" | "public";
  activeTab: ProfileTab;
  basePath: string;
}) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const joined = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(profile.joinedAtIso),
  );
  const stats = [
    {
      key: "followers",
      value: profile.stats.followersCount,
      href: `${basePath}?connections=followers`,
    },
    {
      key: "following",
      value: profile.stats.followingCount,
      href: `${basePath}?connections=following`,
    },
    { key: "decks", value: profile.stats.decksCount, href: `${basePath}?tab=decks` },
    {
      key: "collection",
      value: profile.stats.collectionCardsCount,
      href: `${basePath}?tab=collection`,
    },
  ] as const;

  return (
    <>
      <div className="relative h-40 overflow-hidden rounded-[1.75rem] border bg-[linear-gradient(135deg,color-mix(in_oklch,var(--safir)_32%,var(--card)),color-mix(in_oklch,var(--mineral)_18%,var(--background)))] sm:h-52 lg:h-60">
        {profile.bannerUrl ? (
          <Image src={profile.bannerUrl} alt="" fill preload sizes="(max-width: 1280px) 100vw, 1152px" className="object-cover" />
        ) : (
          <>
            <div className="surface-grid absolute inset-0 opacity-30" />
            <div className="absolute -top-28 left-[12%] size-72 rounded-full bg-safir/20 blur-3xl" />
            <div className="absolute -right-20 -bottom-32 size-80 rounded-full bg-mineral/15 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-px w-2/3 -translate-x-1/2 rotate-[-8deg] bg-white/25" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
      </div>

      <section className="relative px-2 sm:px-6 lg:px-10">
        <div className="grid gap-x-8 md:grid-cols-[9rem_minmax(0,1fr)]">
          <div className="flex justify-center md:block">
            <ProfileAvatar
              src={profile.avatarUrl}
              name={profile.displayName}
              preload
              className="-mt-11 size-24 border-[5px] shadow-lg sm:-mt-14 sm:size-28 md:-mt-16 md:size-36 md:border-[6px]"
            />
          </div>

          <div className="min-w-0 pt-4 md:pt-5">
            <div className="flex flex-col items-center gap-4 text-center md:items-stretch md:text-left lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="truncate font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                  {profile.displayName}
                </h1>
                <p className="mt-1 text-sm font-medium text-muted-foreground">@{profile.username}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start lg:justify-end">
                {mode === "owner" ? (
                  <>
                    <Button nativeButton={false} variant="secondary" size="lg" render={<Link href="/settings/profile" />}>
                      <Edit3 aria-hidden="true" /> {t("actions.edit")}
                    </Button>
                    <Button
                      nativeButton={false}
                      variant="outline"
                      size="lg"
                      render={<Link href="/settings" />}
                      aria-label={t("actions.settings")}
                      title={t("actions.settings")}
                      className="px-2.5 sm:px-3"
                    >
                      <Settings aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">{t("actions.settings")}</span>
                    </Button>
                  </>
                ) : (
                  <FollowButton
                    username={profile.username}
                    initialFollowing={viewer.isFollowing}
                    signedIn={viewer.signedIn}
                  />
                )}
                <ShareProfileButton
                  displayName={profile.displayName}
                  username={profile.username}
                  compactOnMobile
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-4 border-y py-4 sm:flex sm:gap-8 sm:border-y-0 sm:py-0">
              {stats.map(({ key, value, href }) => (
                <Link
                  key={key}
                  href={href}
                  className="group flex min-w-0 flex-col items-center gap-0.5 text-center sm:flex-row sm:gap-1.5 sm:text-left"
                >
                  <span className="font-heading text-lg font-semibold tabular-nums sm:text-base">{value}</span>
                  <span className="truncate text-[0.65rem] text-muted-foreground transition group-hover:text-safir sm:text-sm">
                    {t(`stats.${key}`)}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mx-auto mt-5 max-w-2xl text-center md:mx-0 md:text-left">
              {profile.bio ? (
                <p className="whitespace-pre-line text-sm leading-6 text-foreground/85">{profile.bio}</p>
              ) : (
                <p className="text-sm italic text-muted-foreground/70">{t("emptyBio")}</p>
              )}
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground md:justify-start">
                <CalendarDays className="size-3.5" aria-hidden="true" /> {t("joined", { date: joined })}
              </p>
            </div>
          </div>
        </div>

        <nav className="sticky top-0 z-20 mt-8 grid grid-cols-4 overflow-hidden border-y bg-background/92 backdrop-blur-xl sm:mt-10 sm:flex sm:justify-center sm:gap-1" aria-label={t("tabs.label")}>
          {tabNames.map((tab) => {
            const Icon = tabIcons[tab];
            return (
              <Link
                key={tab}
                href={tab === "overview" ? basePath : `${basePath}?tab=${tab}`}
                aria-current={activeTab === tab ? "page" : undefined}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-3 text-[0.58rem] font-semibold tracking-[0.04em] whitespace-nowrap uppercase transition sm:inline-flex sm:shrink-0 sm:flex-row sm:gap-2 sm:px-5 sm:py-3.5 sm:text-[0.68rem] sm:tracking-[0.08em] ${
                  activeTab === tab
                    ? "text-foreground after:absolute after:inset-x-2 after:top-[-1px] after:h-0.5 after:bg-foreground sm:after:inset-x-3"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4 sm:size-3.5" aria-hidden="true" />
                {t(`tabs.${tab}`)}
              </Link>
            );
          })}
        </nav>
      </section>
    </>
  );
}
