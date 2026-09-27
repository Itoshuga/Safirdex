import "server-only";

import { unstable_cache } from "next/cache";

import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import {
  mapActivityPage,
  normalizeProfileSearch,
  normalizeUsername,
} from "@/features/community/server/profile-service";
import type {
  CommunityDeckItem,
  CommunityFeedPage,
  CommunityUserResult,
  PublicUserProfileDocument,
} from "@/features/community/types";
import { listDecks } from "@/features/decks/server/deck-service";
import { firestoreDateIso } from "@/lib/firebase/timestamp";
import type { AppLocale } from "@/lib/i18n/locales";
import { activitiesRepository } from "@/repositories/activities.repository";
import { followsRepository } from "@/repositories/follows.repository";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";

function userResult(
  profile: PublicUserProfileDocument,
  followingIds: Set<string>,
  viewerId: string | null,
): CommunityUserResult {
  return {
    username: profile.username,
    displayName: profile.displayName,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.bannerUrl ? { bannerUrl: profile.bannerUrl } : {}),
    ...(profile.bio ? { bio: profile.bio } : {}),
    joinedAtIso: firestoreDateIso(profile.joinedAt),
    stats: {
      ...profile.stats,
      decksCount:
        profile.visibility.decks === "public" ? profile.stats.decksCount : 0,
      collectionCardsCount:
        profile.visibility.collection === "public"
          ? profile.stats.collectionCardsCount
          : 0,
    },
    visibility: profile.visibility,
    isFollowing: followingIds.has(profile.id),
    isSelf: profile.id === viewerId,
  };
}

async function attachViewerState(
  profiles: PublicUserProfileDocument[],
  viewerId: string | null,
) {
  const visible = profiles.filter(
    (profile) => profile.visibility.publicProfile || profile.id === viewerId,
  );
  const followingIds = await followsRepository.getFollowingStates(
    viewerId,
    visible.map((profile) => profile.id),
  );
  return visible.map((profile) => userResult(profile, followingIds, viewerId));
}

async function searchProfiles(query: string, limit: number) {
  const value = query.trim().replace(/^@/, "");
  if (value.length < 2) return [];

  const displayPrefix = normalizeProfileSearch(value);
  const [byUsername, byDisplayName] = await Promise.all([
    Promise.resolve().then(async () => {
      try {
        return await publicProfilesRepository.searchByUsernamePrefix(
          normalizeUsername(value),
          limit,
        );
      } catch {
        return [];
      }
    }),
    displayPrefix
      ? publicProfilesRepository.searchByDisplayNamePrefix(displayPrefix, limit)
      : Promise.resolve([]),
  ]);

  return [
    ...new Map(
      [...byUsername, ...byDisplayName].map((profile) => [profile.id, profile]),
    ).values(),
  ].slice(0, limit);
}

export async function searchCommunityUsers({
  viewerId,
  query,
  limit = 20,
}: {
  viewerId: string | null;
  query: string;
  limit?: number;
}) {
  return attachViewerState(await searchProfiles(query, limit), viewerId);
}

export async function getSuggestedUsers(
  viewerId: string | null,
  limit = 5,
) {
  const profiles = await publicProfilesRepository.discover(
    limit + (viewerId ? 1 : 0),
  );
  const suggestions = (await attachViewerState(profiles, viewerId))
    .filter((profile) => !profile.isSelf)
    .sort((left, right) => Number(left.isFollowing) - Number(right.isFollowing));
  return suggestions.slice(0, limit);
}

export async function getDiscoverFeed(
  locale: AppLocale,
  cursor?: string,
): Promise<CommunityFeedPage> {
  if (cursor) {
    return mapActivityPage(await activitiesRepository.discover(cursor), locale);
  }
  return unstable_cache(
    async () => mapActivityPage(await activitiesRepository.discover(), locale),
    ["community-discover-feed-v2", locale],
    { tags: [COMMUNITY_CACHE_TAGS.discover], revalidate: 120 },
  )();
}

export async function getFollowingFeed(
  locale: AppLocale,
  viewerId: string,
  cursor?: string,
) {
  return mapActivityPage(
    await activitiesRepository.following(viewerId, cursor),
    locale,
  );
}

async function getRecentCommunityDecks(
  locale: AppLocale,
): Promise<CommunityDeckItem[]> {
  return unstable_cache(
    async () => {
      const page = await listDecks({
        locale,
        viewerId: null,
        scope: "community",
        sort: "recent",
        limit: 6,
      });
      return page.items;
    },
    ["community-recent-decks-v1", locale],
    { tags: [COMMUNITY_CACHE_TAGS.discover], revalidate: 120 },
  )();
}

export async function getCommunityPageData({
  locale,
  viewerId,
  mode,
  cursor,
}: {
  locale: AppLocale;
  viewerId: string | null;
  mode: "discover" | "following";
  cursor?: string;
}) {
  const [people, recentDecks, feed] = await Promise.all([
    getSuggestedUsers(viewerId),
    getRecentCommunityDecks(locale),
    mode === "following" && viewerId
      ? getFollowingFeed(locale, viewerId, cursor)
      : mode === "discover"
        ? getDiscoverFeed(locale, cursor)
        : Promise.resolve({ items: [] } satisfies CommunityFeedPage),
  ]);

  return { people, recentDecks, feed, mode };
}

export async function getCommunityPeoplePageData({
  viewerId,
  query,
}: {
  viewerId: string | null;
  query: string;
}) {
  const trimmedQuery = query.trim();
  const people = trimmedQuery
    ? await searchCommunityUsers({ viewerId, query: trimmedQuery })
    : await getSuggestedUsers(viewerId, 18);
  return { query: trimmedQuery, people };
}
