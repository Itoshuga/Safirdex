import { ArrowUpRight, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { FollowButton } from "@/components/community/follow-button";
import { ProfileAvatar } from "@/components/community/profile-avatar";
import type { CommunityConnectionItem, CommunityUserResult } from "@/features/community/types";
import { Link } from "@/i18n/navigation";

type UserCardData = CommunityUserResult | CommunityConnectionItem;

export function UserCard({ user, signedIn }: { user: UserCardData; signedIn: boolean }) {
  const t = useTranslations("Community");

  return (
    <article className="flex min-w-0 items-start gap-3 rounded-2xl border bg-card p-4 sm:gap-4">
      <Link href={`/user/@${user.username}`} aria-label={t("viewProfile", { name: user.displayName })}>
        <ProfileAvatar src={user.avatarUrl} name={user.displayName} className="size-12 border-2 sm:size-14" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/user/@${user.username}`} className="group inline-flex max-w-full items-center gap-1 font-semibold hover:text-safir">
              <span className="truncate">{user.displayName}</span>
              <ArrowUpRight className="size-3.5 opacity-0 transition group-hover:opacity-100" />
            </Link>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          </div>
          {!("isSelf" in user && user.isSelf) ? (
            <FollowButton
              username={user.username}
              initialFollowing={user.isFollowing}
              signedIn={signedIn}
              compact
            />
          ) : null}
        </div>
        {user.bio ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{user.bio}</p> : null}
        <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-muted-foreground">
          <Users className="size-3" />
          {t("followersCount", {
            count: "followersCount" in user
              ? user.followersCount
              : user.stats.followersCount,
          })}
        </p>
      </div>
    </article>
  );
}
