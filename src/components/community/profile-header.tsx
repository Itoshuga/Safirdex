import { CalendarDays, Edit3, Layers3, Library, Users } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { FollowButton } from "@/components/community/follow-button";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Button } from "@/components/ui/button";
import type {
  ProfileTab,
  ProfileViewerState,
  PublicProfileView,
} from "@/features/community/types";
import { Link } from "@/i18n/navigation";

const tabNames: ProfileTab[] = ["overview", "decks", "collection", "activity"];

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
      icon: Users,
      href: `${basePath}?connections=followers`,
    },
    {
      key: "following",
      value: profile.stats.followingCount,
      icon: Users,
      href: `${basePath}?connections=following`,
    },
    { key: "decks", value: profile.stats.decksCount, icon: Layers3, href: `${basePath}?tab=decks` },
    {
      key: "collection",
      value: profile.stats.collectionCardsCount,
      icon: Library,
      href: `${basePath}?tab=collection`,
    },
  ] as const;

  return (
    <>
      <div className="relative h-44 overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,color-mix(in_oklch,var(--safir)_35%,var(--card)),color-mix(in_oklch,var(--mineral)_20%,var(--background)))] sm:h-56">
        {profile.bannerUrl ? (
          <Image src={profile.bannerUrl} alt="" fill preload sizes="(max-width: 1440px) 100vw, 1312px" className="object-cover" />
        ) : (
          <div className="surface-grid absolute inset-0 opacity-35" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      </div>

      <section className="relative px-1 sm:px-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <ProfileAvatar
              src={profile.avatarUrl}
              name={profile.displayName}
              className="-mt-12 size-24 sm:-mt-16 sm:size-32"
            />
            <div className="mt-4">
              <h1 className="font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-sm font-medium text-safir">@{profile.username}</p>
            </div>
          </div>
          {mode === "owner" ? (
            <Button nativeButton={false} variant="outline" size="lg" render={<a href="#edit-profile" />}>
              <Edit3 /> {t("actions.edit")}
            </Button>
          ) : (
            <FollowButton
              username={profile.username}
              initialFollowing={viewer.isFollowing}
              signedIn={viewer.signedIn}
            />
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            {profile.bio ? (
              <p className="text-sm leading-6 text-muted-foreground">{profile.bio}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground/70">{t("emptyBio")}</p>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" /> {t("joined", { date: joined })}
            </p>
          </div>
          <dl className="grid grid-cols-4 divide-x rounded-xl border bg-card py-3">
            {stats.map(({ key, value, icon: Icon, href }) => (
              <Link key={key} href={href} className="group min-w-16 px-3 text-center sm:min-w-20">
                <dt className="flex items-center justify-center gap-1 text-[0.6rem] font-semibold tracking-wide text-muted-foreground uppercase group-hover:text-safir">
                  <Icon className="hidden size-3 sm:block" /> {t(`stats.${key}`)}
                </dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</dd>
              </Link>
            ))}
          </dl>
        </div>

        <nav className="mt-8 flex gap-1 overflow-x-auto border-b" aria-label={t("tabs.label")}>
          {tabNames.map((tab) => (
            <Link
              key={tab}
              href={tab === "overview" ? basePath : `${basePath}?tab=${tab}`}
              aria-current={activeTab === tab ? "page" : undefined}
              className={`relative shrink-0 px-4 py-3 text-sm font-semibold transition hover:text-foreground ${
                activeTab === tab
                  ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-safir"
                  : "text-muted-foreground"
              }`}
            >
              {t(`tabs.${tab}`)}
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}
