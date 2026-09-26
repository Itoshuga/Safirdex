import "server-only";

import { unstable_cache } from "next/cache";

import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import {
  mapActivityPage,
  normalizeProfileSearch,
  normalizeUsername,
} from "@/features/community/server/profile-service";
import type {
  CommunityFeedPage,
  CommunityUserResult,
  PublicUserProfileDocument,
} from "@/features/community/types";
import type { AppLocale } from "@/lib/i18n/locales";
import { activitiesRepository } from "@/repositories/activities.repository";
import { followsRepository } from "@/repositories/follows.repository";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";

function userResult(
  profile: PublicUserProfileDocument,
  isFollowing: boolean,
): CommunityUserResult {
  return {
    username: profile.username,
    displayName: profile.displayName,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.bannerUrl ? { bannerUrl: profile.bannerUrl } : {}),
    ...(profile.bio ? { bio: profile.bio } : {}),
    joinedAtIso: profile.joinedAt.toDate().toISOString(),
    stats: {
      ...profile.stats,
      decksCount: profile.visibility.decks === "public" ? profile.stats.decksCount : 0,
      collectionCardsCount:
        profile.visibility.collection === "public"
          ? profile.stats.collectionCardsCount
          : 0,
    },
    visibility: profile.visibility,
    isFollowing,
  };
}

async function discoverFeed(locale: AppLocale, cursor?: string) {
  if (cursor) return mapActivityPage(await activitiesRepository.discover(cursor), locale);
  return unstable_cache(
    async () => mapActivityPage(await activitiesRepository.discover(), locale),
    ["community-discover-feed-v1", locale],
    { tags: [COMMUNITY_CACHE_TAGS.discover], revalidate: 120 },
  )();
}

export async function getCommunityPageData({
  locale,
  viewerId,
  mode,
  query,
  cursor,
}: {
  locale: AppLocale;
  viewerId: string | null;
  mode: "discover" | "following";
  query: string;
  cursor?: string;
}) {
  let profiles: PublicUserProfileDocument[];
  const trimmedQuery = query.trim();
  if (trimmedQuery.length >= 3) {
    const displayPrefix = normalizeProfileSearch(trimmedQuery.replace(/^@/, ""));
    const [byUsername, byDisplayName] = await Promise.all([
      Promise.resolve().then(async () => {
        try {
          return await publicProfilesRepository.searchByUsernamePrefix(
            normalizeUsername(trimmedQuery.replace(/^@/, "")),
          );
        } catch {
          return [];
        }
      }),
      displayPrefix
        ? publicProfilesRepository.searchByDisplayNamePrefix(displayPrefix)
        : Promise.resolve([]),
    ]);
    profiles = [...new Map(
      [...byUsername, ...byDisplayName].map((profile) => [profile.id, profile]),
    ).values()].slice(0, 20);
  } else {
    profiles = await publicProfilesRepository.discover();
  }
  const followingIds = await followsRepository.getFollowingStates(
    viewerId,
    profiles.map((profile) => profile.id),
  );
  const people = profiles
    .filter((profile) => profile.id !== viewerId)
    .map((profile) => userResult(profile, followingIds.has(profile.id)));

  let feed: CommunityFeedPage;
  if (mode === "following" && viewerId) {
    feed = mapActivityPage(await activitiesRepository.following(viewerId, cursor), locale);
  } else {
    feed = await discoverFeed(locale, cursor);
  }
  return { people, feed, query: trimmedQuery, mode };
}
