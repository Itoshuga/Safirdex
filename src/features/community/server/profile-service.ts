import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";

import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import type {
  CommunityActivityDocument,
  CommunityActivityItem,
  CommunityConnectionItem,
  CommunityFeedPage,
  ProfileCollectionItem,
  ProfileDeckItem,
  ProfileTab,
  ProfileTabContent,
  PublicProfileView,
  PublicUserProfileDocument,
} from "@/features/community/types";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
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
    joinedAtIso: profile.joinedAt.toDate().toISOString(),
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
    userRef.collection("decks").count().get(),
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

  const previousUsernameNormalized = await firestore.runTransaction(async (transaction) => {
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
    return oldUsernameNormalized;
  });

  await getFirebaseAdminAuth().updateUser(userId, { displayName: data.displayName });
  return { usernameNormalized, previousUsernameNormalized };
}

export async function updateProfilePrivacy(userId: string, input: unknown) {
  const visibility = privacyUpdateSchema.parse(input);
  const profileRef = publicProfilesRepository.reference(userId);
  await profileRef.update({ visibility, updatedAt: FieldValue.serverTimestamp() });
  const updated = await publicProfilesRepository.getById(userId);
  if (!updated) throw new Error("PROFILE_NOT_FOUND");
  await setActorActivitiesPublished(updated);
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
      createdAtIso: activity.createdAt.toDate().toISOString(),
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
    createdAtIso: activity.createdAt.toDate().toISOString(),
    payload: activity.payload as Extract<CommunityActivityDocument["payload"], { deck: object }>,
  };
}

export function mapActivityPage(
  page: { items: CommunityActivityDocument[]; nextCursor?: string },
  locale: AppLocale,
): CommunityFeedPage {
  return {
    items: page.items.map((item) => mapActivity(item, locale)),
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
): Promise<ProfileDeckItem[]> {
  let query = getFirebaseAdminFirestore()
    .collection("users")
    .doc(profile.id)
    .collection("decks")
    .orderBy("updatedAt", "desc")
    .limit(12);
  if (!owner) query = query.where("visibility", "==", "public");
  const snapshot = await query.get();
  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      name: String(data.name ?? ""),
      slug: String(data.slug ?? document.id),
      cardCount: Number(data.cardCount ?? 0),
      ...(typeof data.commanderName === "string" ? { commanderName: data.commanderName } : {}),
      ...(typeof data.artworkUrl === "string" ? { artworkUrl: data.artworkUrl } : {}),
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
  cursor,
}: {
  profile: PublicUserProfileDocument;
  tab: ProfileTab;
  locale: AppLocale;
  owner: boolean;
  cursor?: string;
}): Promise<ProfileTabContent> {
  if (tab === "overview") return { tab };
  const privateSection = !owner && profile.visibility[tab] === "private";
  if (privateSection) {
    return tab === "activity"
      ? { tab, private: true, feed: { items: [] } }
      : { tab, private: true, items: [] };
  }
  if (tab === "decks") return { tab, private: false, items: await getDecks(profile, owner) };
  if (tab === "collection") {
    return { tab, private: false, items: await getCollection(profile, locale) };
  }
  return {
    tab,
    private: false,
    feed: mapActivityPage(await activitiesRepository.byActor(profile.id, owner, cursor), locale),
  };
}
