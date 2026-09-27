import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";

import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import { mapPostFeedDocument, setActorPostsPublished, setPostAttachmentAvailability } from "@/features/community/server/post-service";
import type {
  CommunityActivityDocument,
  CommunityActivityItem,
  CommunityConnectionItem,
  CommunityFeedDocument,
  CommunityFeedPage,
  ProfileCollectionItem,
  ProfileDeckItem,
  ProfileTab,
  ProfileTabContent,
  PublicProfileView,
  PublicUserProfileDocument,
} from "@/features/community/types";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore, getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { firestoreDateIso } from "@/lib/firebase/timestamp";
import { getLocalizedName } from "@/lib/i18n/get-localized-value";
import type { AppLocale } from "@/lib/i18n/locales";
import { activitiesRepository } from "@/repositories/activities.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { followsRepository } from "@/repositories/follows.repository";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";
import {
  privacyUpdateSchema,
  profileUpdateSchema,
  usernameSchema,
} from "@/validation/community";
import { setActorActivitiesPublished } from "@/features/community/server/activity-service";

interface PrivateUserDocument {
  username?: string | null;
  usernameNormalized?: string | null;
  pseudonym?: string | null;
  pseudonymKey?: string | null;
  displayName?: string | null;
  createdAt?: Timestamp;
}

export function normalizeUsername(value: string) {
  return usernameSchema.parse(value).toLowerCase();
}

export function normalizeProfileSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function toProfileView(
  profile: PublicUserProfileDocument,
  owner: boolean,
): PublicProfileView {
  return {
    username: profile.username,
    displayName: profile.displayName,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.bannerUrl ? { bannerUrl: profile.bannerUrl } : {}),
    ...(profile.bio ? { bio: profile.bio } : {}),
    joinedAtIso: firestoreDateIso(profile.joinedAt),
    stats: owner
      ? profile.stats
      : {
          ...profile.stats,
          decksCount: profile.visibility.decks === "public" ? profile.stats.decksCount : 0,
          collectionCardsCount:
            profile.visibility.collection === "public"
              ? profile.stats.collectionCardsCount
              : 0,
        },
    visibility: profile.visibility,
  };
}

async function resolveProfileUncached(usernameNormalized: string) {
  const direct = await publicProfilesRepository.getByNormalizedUsername(usernameNormalized);
  if (direct) return { profile: direct, matchedAlias: false };

  const alias = await getFirebaseAdminFirestore()
    .collection("usernames")
    .doc(usernameNormalized)
    .get();
  const userId = alias.get("userId") as string | undefined;
  if (!userId) return null;
  const profile = await publicProfilesRepository.getById(userId);
  return profile ? { profile, matchedAlias: true } : null;
}

export async function resolvePublicProfile(username: string) {
  let normalized: string;
  try {
    normalized = normalizeUsername(username.replace(/^@/, ""));
  } catch {
    return null;
  }

  return unstable_cache(
    () => resolveProfileUncached(normalized),
    ["community-public-profile-v1", normalized],
    {
      tags: [COMMUNITY_CACHE_TAGS.profiles, COMMUNITY_CACHE_TAGS.profile(normalized)],
      revalidate: 3_600,
    },
  )();
}

export async function ensurePublicProfileForUser(userId: string) {
  const existing = await publicProfilesRepository.getById(userId);
  if (existing) return existing;

  const firestore = getFirebaseAdminFirestore();
  const userRef = firestore.collection("users").doc(userId);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.exists) return null;
  const user = userSnapshot.data() as PrivateUserDocument;
  const rawUsername = user.username ?? user.pseudonym;
  if (!rawUsername) return null;

  let usernameNormalized: string;
  try {
    usernameNormalized = normalizeUsername(rawUsername);
  } catch {
    return null;
  }

  const profileRef = publicProfilesRepository.reference(userId);
  const usernameRef = firestore.collection("usernames").doc(usernameNormalized);
  const [deckCountSnapshot, collectionCountSnapshot] = await Promise.all([
    firestore.collection("decks").where("authorId", "==", userId).where("visibility", "==", "public").where("status", "==", "published").count().get(),
    userRef.collection("collection").count().get(),
  ]);

  await firestore.runTransaction(async (transaction) => {
    const [currentProfile, reservation] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(usernameRef),
    ]);
    if (currentProfile.exists) return;
    const reservedUserId =
      (reservation.get("userId") as string | undefined) ??
      (reservation.get("uid") as string | undefined);
    if (reservation.exists && reservedUserId !== userId) {
      throw new Error("USERNAME_TAKEN");
    }

    const joinedAt = user.createdAt ?? Timestamp.now();
    const profile = {
      username: rawUsername,
      usernameNormalized,
      displayName: user.displayName ?? rawUsername,
      displayNameNormalized: normalizeProfileSearch(user.displayName ?? rawUsername),
      bio: "",
      joinedAt,
      updatedAt: FieldValue.serverTimestamp(),
      stats: {
        followersCount: 0,
        followingCount: 0,
        decksCount: deckCountSnapshot.data().count,
        collectionCardsCount: collectionCountSnapshot.data().count,
      },
      visibility: {
        publicProfile: true,
        decks: "public",
        collection: "private",
        activity: "public",
      },
    };
    transaction.create(profileRef, profile);
    transaction.set(
      usernameRef,
      {
        userId,
        username: rawUsername,
        currentUsernameNormalized: usernameNormalized,
        isAlias: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    transaction.set(
      userRef,
      { username: rawUsername, usernameNormalized, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });

  return publicProfilesRepository.getById(userId);
}

export async function getAccountProfile(userId: string) {
  const profile = await ensurePublicProfileForUser(userId);
  return profile ? { internal: profile, view: toProfileView(profile, true) } : null;
}

export async function createCommunityProfile(
  userId: string,
  input: { username: string; displayName: string },
) {
  const usernameNormalized = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  if (displayName.length < 2 || displayName.length > 40) throw new Error("INVALID_PROFILE");
  const firestore = getFirebaseAdminFirestore();
  const profileRef = publicProfilesRepository.reference(userId);
  const userRef = firestore.collection("users").doc(userId);
  const usernameRef = firestore.collection("usernames").doc(usernameNormalized);
  await firestore.runTransaction(async (transaction) => {
    const [profile, user, reservation] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(userRef),
      transaction.get(usernameRef),
    ]);
    if (profile.exists) return;
    const reservedUserId =
      (reservation.get("userId") as string | undefined) ??
      (reservation.get("uid") as string | undefined);
    if (reservation.exists && reservedUserId !== userId) throw new Error("USERNAME_TAKEN");
    transaction.create(profileRef, {
      username: input.username,
      usernameNormalized,
      displayName,
      displayNameNormalized: normalizeProfileSearch(displayName),
      bio: "",
      joinedAt: (user.get("createdAt") as Timestamp | undefined) ?? Timestamp.now(),
      updatedAt: FieldValue.serverTimestamp(),
      stats: { followersCount: 0, followingCount: 0, decksCount: 0, collectionCardsCount: 0 },
      visibility: { publicProfile: true, decks: "public", collection: "private", activity: "public" },
    });
    transaction.set(usernameRef, {
      userId,
      username: input.username,
      currentUsernameNormalized: usernameNormalized,
      isAlias: false,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(userRef, {
      username: input.username,
      usernameNormalized,
      pseudonym: input.username,
      pseudonymKey: usernameNormalized,
      displayName,
      displayNameKey: displayName.toLowerCase(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await getFirebaseAdminAuth().updateUser(userId, { displayName });
  return publicProfilesRepository.getById(userId);
}

export async function getPublicProfileView(username: string) {
  const resolved = await resolvePublicProfile(username);
  if (!resolved || !resolved.profile.visibility.publicProfile) return null;
  return {
    internal: resolved.profile,
    view: toProfileView(resolved.profile, false),
    matchedAlias: resolved.matchedAlias,
  };
}

export async function updatePublicProfile(userId: string, input: unknown) {
  const data = profileUpdateSchema.parse(input);
  const usernameNormalized = normalizeUsername(data.username);
  const firestore = getFirebaseAdminFirestore();
  const profileRef = publicProfilesRepository.reference(userId);
  const userRef = firestore.collection("users").doc(userId);
  const newUsernameRef = firestore.collection("usernames").doc(usernameNormalized);

  const previous = await firestore.runTransaction(async (transaction) => {
    const [profileSnapshot, reservation] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(newUsernameRef),
    ]);
    if (!profileSnapshot.exists) throw new Error("PROFILE_NOT_FOUND");
    const profile = { id: profileSnapshot.id, ...profileSnapshot.data() } as PublicUserProfileDocument;
    const reservedUserId =
      (reservation.get("userId") as string | undefined) ??
      (reservation.get("uid") as string | undefined);
    if (reservation.exists && reservedUserId !== userId) throw new Error("USERNAME_TAKEN");

    const oldUsernameNormalized = profile.usernameNormalized;
    transaction.update(profileRef, {
      username: data.username,
      usernameNormalized,
      displayName: data.displayName,
      displayNameNormalized: normalizeProfileSearch(data.displayName),
      bio: data.bio,
      avatarUrl: data.avatarUrl || FieldValue.delete(),
      avatarStoragePath: data.avatarStoragePath || FieldValue.delete(),
      bannerUrl: data.bannerUrl || FieldValue.delete(),
      bannerStoragePath: data.bannerStoragePath || FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(
      newUsernameRef,
      {
        userId,
        username: data.username,
        currentUsernameNormalized: usernameNormalized,
        isAlias: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (oldUsernameNormalized !== usernameNormalized) {
      transaction.set(
        firestore.collection("usernames").doc(oldUsernameNormalized),
        {
          userId,
          username: profile.username,
          currentUsernameNormalized: usernameNormalized,
          isAlias: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    transaction.set(
      userRef,
      {
        username: data.username,
        usernameNormalized,
        pseudonym: data.username,
        pseudonymKey: usernameNormalized,
        displayName: data.displayName,
        displayNameKey: data.displayName.toLowerCase(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return {
      usernameNormalized: oldUsernameNormalized,
      removedStoragePaths: [
        !data.avatarStoragePath && profile.avatarStoragePath ? profile.avatarStoragePath : null,
        !data.bannerStoragePath && profile.bannerStoragePath ? profile.bannerStoragePath : null,
      ].filter((path): path is string => Boolean(path)),
    };
  });

  await getFirebaseAdminAuth().updateUser(userId, { displayName: data.displayName });
  await Promise.allSettled(
    previous.removedStoragePaths.map((path) =>
      getFirebaseAdminStorage().bucket().file(path).delete({ ignoreNotFound: true }),
    ),
  );
  return { usernameNormalized, previousUsernameNormalized: previous.usernameNormalized };
}

export async function updateProfilePrivacy(userId: string, input: unknown) {
  const visibility = privacyUpdateSchema.parse(input);
  const profileRef = publicProfilesRepository.reference(userId);
  await profileRef.update({ visibility, updatedAt: FieldValue.serverTimestamp() });
  const updated = await publicProfilesRepository.getById(userId);
  if (!updated) throw new Error("PROFILE_NOT_FOUND");
  await Promise.all([
    setActorActivitiesPublished(updated),
    setActorPostsPublished(updated),
    updated.visibility.collection === "private"
      ? setPostAttachmentAvailability(`collection:${userId}`, false)
      : Promise.resolve(),
  ]);
  return updated;
}

export async function getConnectionPage({
  profileId,
  viewerId,
  kind,
  cursor,
}: {
  profileId: string;
  viewerId: string | null;
  kind: "followers" | "following";
  cursor?: string;
}) {
  const page = await followsRepository.list(profileId, kind, cursor);
  const currentProfiles = await publicProfilesRepository.getManyByIds(
    page.items.map((item) => item.userId),
  );
  const visibleProfiles = currentProfiles.filter(
    (profile) => profile.visibility.publicProfile || profile.id === viewerId,
  );
  const following = await followsRepository.getFollowingStates(
    viewerId,
    visibleProfiles.map((profile) => profile.id),
  );
  const items: CommunityConnectionItem[] = visibleProfiles.map((profile) => ({
    username: profile.username,
    displayName: profile.displayName,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.bio ? { bio: profile.bio } : {}),
    followersCount: profile.stats.followersCount,
    isFollowing: following.has(profile.id),
    isSelf: profile.id === viewerId,
  }));
  return { items, nextCursor: page.nextCursor };
}

function mapActivity(
  activity: CommunityActivityDocument,
  locale: AppLocale,
): CommunityActivityItem {
  const actor = {
    userId: activity.actor.userId,
    username: activity.actor.username,
    displayName: activity.actor.displayName,
    ...(activity.actor.avatarUrl ? { avatarUrl: activity.actor.avatarUrl } : {}),
  };
  if (activity.type === "collection_updated") {
    const payload = activity.payload as Extract<CommunityActivityDocument["payload"], { addedCount: number }>;
    return {
      id: activity.id,
      actor,
      type: activity.type,
      visibility: activity.visibility,
      createdAtIso: firestoreDateIso(activity.createdAt),
      payload: {
        addedCount: payload.addedCount,
        cards: payload.cards.map((card) => ({
          ...card,
          name: getLocalizedName(card.translations, locale),
        })),
      },
    };
  }
  return {
    id: activity.id,
    actor,
    type: activity.type,
    visibility: activity.visibility,
    createdAtIso: firestoreDateIso(activity.createdAt),
    payload: activity.payload as Extract<CommunityActivityDocument["payload"], { deck: object }>,
  };
}

export function mapFeedPage(
  page: { items: CommunityFeedDocument[]; nextCursor?: string },
  locale: AppLocale,
  viewerId: string | null,
): CommunityFeedPage {
  return {
    items: page.items.map((item) => item.kind === "post"
      ? { id: item.id, kind: "post" as const, post: mapPostFeedDocument(item, locale, viewerId) }
      : { id: item.id, kind: "activity" as const, activity: mapActivity(item as CommunityActivityDocument, locale) }),
    ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
  };
}

export function parseProfileTab(value: string | string[] | undefined): ProfileTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === "decks" || tab === "collection" || tab === "activity"
    ? tab
    : "overview";
}

async function getDecks(
  profile: PublicUserProfileDocument,
  owner: boolean,
  locale: AppLocale,
  limit = 12,
): Promise<ProfileDeckItem[]> {
  const collection = getFirebaseAdminFirestore().collection("decks");
  let query = collection
    .where("authorId", "==", profile.id)
    .orderBy("updatedAt", "desc")
    .limit(limit);
  if (!owner) query = query.where("visibility", "==", "public").where("status", "==", "published");
  let documents: FirebaseFirestore.QueryDocumentSnapshot[];
  try {
    documents = (await query.get()).docs;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
    const message = error instanceof Error ? error.message : "";
    if (code !== 9 && code !== "failed-precondition" && !/requires an index/i.test(message)) {
      throw error;
    }

    // Keep profiles usable while a newly declared composite index is building.
    // The equality-only query uses Firestore's automatic single-field index.
    const fallback = await collection
      .where("authorId", "==", profile.id)
      .limit(Math.max(100, limit * 5))
      .get();
    documents = fallback.docs
      .filter((document) => owner || (
        document.get("visibility") === "public" &&
        document.get("status") === "published"
      ))
      .sort((left, right) => {
        const leftDate = left.get("updatedAt");
        const rightDate = right.get("updatedAt");
        const leftMillis = leftDate instanceof Timestamp ? leftDate.toMillis() : 0;
        const rightMillis = rightDate instanceof Timestamp ? rightDate.toMillis() : 0;
        return rightMillis - leftMillis || right.id.localeCompare(left.id);
      })
      .slice(0, limit);
  }
  return documents.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      name: String(data.name ?? ""),
      slug: String(data.slug ?? document.id),
      cardCount: Number(data.stats?.cardCount ?? 0),
      ...(data.preview?.commanderTranslations || typeof data.preview?.commanderName === "string" ? { commanderName: getLocalizedName(data.preview?.commanderTranslations, locale) || data.preview?.commanderName } : {}),
      ...(typeof data.preview?.artworkUrl === "string" ? { artworkUrl: data.preview.artworkUrl } : {}),
      ...(data.status === "draft" || data.status === "published" ? { status: data.status } : {}),
      ...(data.visibility === "private" || data.visibility === "unlisted" || data.visibility === "public" ? { visibility: data.visibility } : {}),
    };
  });
}

async function getCollection(
  profile: PublicUserProfileDocument,
  locale: AppLocale,
): Promise<ProfileCollectionItem[]> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection("users")
    .doc(profile.id)
    .collection("collection")
    .orderBy("updatedAt", "desc")
    .limit(12)
    .get();
  const cards = await cardsRepository.getManyByIds(snapshot.docs.map((document) => document.id));
  const byId = new Map(cards.map((card) => [card.id, card]));
  return snapshot.docs.flatMap((document) => {
    const card = byId.get(document.id);
    if (!card) return [];
    return [{
      cardId: card.id,
      slug: card.slug,
      name: getLocalizedName(card.translations, locale),
      ...(card.artwork.url ? { artworkUrl: card.artwork.url } : {}),
      orientation: card.artwork.orientation,
      quantity: Number(document.get("quantity") ?? 1),
    }];
  });
}

export async function getProfileTabContent({
  profile,
  tab,
  locale,
  owner,
  viewerId,
  canViewFollowers = false,
  cursor,
}: {
  profile: PublicUserProfileDocument;
  tab: ProfileTab;
  locale: AppLocale;
  owner: boolean;
  viewerId: string | null;
  canViewFollowers?: boolean;
  cursor?: string;
}): Promise<ProfileTabContent> {
  const feedAccess = owner ? "owner" : canViewFollowers ? "follower" : "public";
  if (tab === "overview") {
    const decksPrivate = !owner && profile.visibility.decks === "private";
    const collectionPrivate = !owner && profile.visibility.collection === "private";
    const activityPrivate = !owner && profile.visibility.activity === "private";
    const [decks, feed] = await Promise.all([
      decksPrivate ? [] : getDecks(profile, owner, locale, 3),
      activityPrivate
        ? { items: [] }
        : activitiesRepository
            .byActor(profile.id, feedAccess, undefined, 3)
            .then((page) => mapFeedPage(page, locale, viewerId)),
    ]);
    return {
      tab,
      decks,
      decksPrivate,
      collectionCount: collectionPrivate ? 0 : profile.stats.collectionCardsCount,
      collectionPrivate,
      feed,
      activityPrivate,
    };
  }
  const privateSection = !owner && profile.visibility[tab] === "private";
  if (privateSection) {
    return tab === "activity"
      ? { tab, private: true, feed: { items: [] } }
      : { tab, private: true, items: [] };
  }
  if (tab === "decks") return { tab, private: false, items: await getDecks(profile, owner, locale) };
  if (tab === "collection") {
    return { tab, private: false, items: await getCollection(profile, locale) };
  }
  return {
    tab,
    private: false,
    feed: mapFeedPage(
      await activitiesRepository.byActor(profile.id, feedAccess, cursor),
      locale,
      viewerId,
    ),
  };
}
