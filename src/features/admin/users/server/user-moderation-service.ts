import "server-only";

import {
  FieldValue,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase-admin/firestore";

import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUsersPageData,
  ModeratedUserRole,
} from "@/features/admin/users/types";
import { getCollectionCatalog } from "@/features/cards/server/codex-service";
import { calculateCollectionStats } from "@/features/collection/domain";
import { collectionRepository } from "@/features/collection/repositories/collection-repository";
import {
  createCommunityProfile,
  updatePublicProfile,
} from "@/features/community/server/profile-service";
import type { PublicUserProfileDocument } from "@/features/community/types";
import { hasAdminClaim } from "@/lib/auth/claims";
import { requireAdminSession } from "@/lib/auth/admin-session";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import { firestoreDate } from "@/lib/firebase/timestamp";
import type { AppLocale } from "@/lib/i18n/locales";

const AUTH_LIST_LIMIT = 1_000;
const USERS_PAGE_SIZE = 25;

interface PrivateUserData extends DocumentData {
  username?: string | null;
  pseudonym?: string | null;
  displayName?: string | null;
  role?: string;
  roles?: unknown;
  onboardingCompleted?: boolean;
  preferredLocale?: string | null;
  createdAt?: unknown;
}

function normalizedSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function dateIso(value: unknown) {
  return firestoreDate(value)?.toISOString() ?? null;
}

function authDateIso(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function stringRoles(value: unknown) {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === "string")
    : [];
}

function roleFromClaims(claims: object): ModeratedUserRole {
  return hasAdminClaim(claims) ? "admin" : "user";
}

async function getDocumentsByIds(collectionName: string, ids: string[]) {
  const firestore = getFirebaseAdminFirestore();
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += 100) {
    chunks.push(ids.slice(index, index + 100));
  }
  const groups = await Promise.all(
    chunks.map((chunk) =>
      firestore.getAll(
        ...chunk.map((id) => firestore.collection(collectionName).doc(id)),
      ),
    ),
  );
  return new Map(
    groups
      .flat()
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => [snapshot.id, snapshot] as const),
  );
}

function profileFromSnapshot(snapshot?: DocumentSnapshot) {
  return snapshot?.exists
    ? ({ id: snapshot.id, ...snapshot.data() } as PublicUserProfileDocument)
    : null;
}

export async function getAdminUsersPage({
  query = "",
  page = 1,
}: {
  query?: string;
  page?: number;
}): Promise<AdminUsersPageData> {
  await requireAdminSession();
  const result = await getFirebaseAdminAuth().listUsers(AUTH_LIST_LIMIT);
  const ids = result.users.map((user) => user.uid);
  const [privateUsers, publicProfiles] = await Promise.all([
    getDocumentsByIds("users", ids),
    getDocumentsByIds("publicProfiles", ids),
  ]);

  const items: AdminUserListItem[] = result.users.map((user) => {
    const privateUser = privateUsers.get(user.uid)?.data() as PrivateUserData | undefined;
    const publicProfile = profileFromSnapshot(publicProfiles.get(user.uid));
    const username = publicProfile?.username ?? privateUser?.username ?? privateUser?.pseudonym ?? null;
    const displayName = publicProfile?.displayName ?? privateUser?.displayName ?? user.displayName ?? user.email ?? user.uid;
    return {
      uid: user.uid,
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      username,
      displayName,
      ...(publicProfile?.avatarUrl ? { avatarUrl: publicProfile.avatarUrl } : {}),
      role: roleFromClaims(user.customClaims ?? {}),
      onboardingCompleted:
        user.customClaims?.onboardingCompleted === true ||
        privateUser?.onboardingCompleted === true,
      collectionCardsCount: Number(publicProfile?.stats?.collectionCardsCount ?? 0),
      createdAtIso: authDateIso(user.metadata.creationTime),
      lastSignInAtIso: authDateIso(user.metadata.lastSignInTime),
    };
  });

  const needle = normalizedSearch(query).slice(0, 100);
  const filtered = items
    .filter((user) => {
      if (!needle) return true;
      return [user.displayName, user.username, user.email, user.uid]
        .filter((value): value is string => Boolean(value))
        .some((value) => normalizedSearch(value).includes(needle));
    })
    .sort((left, right) =>
      (right.createdAtIso ?? "").localeCompare(left.createdAtIso ?? "") ||
      left.displayName.localeCompare(right.displayName),
    );

  const pages = Math.max(1, Math.ceil(filtered.length / USERS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Math.trunc(page) || 1), pages);
  return {
    items: filtered.slice(
      (currentPage - 1) * USERS_PAGE_SIZE,
      currentPage * USERS_PAGE_SIZE,
    ),
    total: filtered.length,
    page: currentPage,
    pages,
    pageSize: USERS_PAGE_SIZE,
    truncated: Boolean(result.pageToken),
  };
}

export async function getAdminUserDetail(
  userId: string,
  locale: AppLocale,
): Promise<AdminUserDetail | null> {
  const session = await requireAdminSession();
  const auth = getFirebaseAdminAuth();
  let authUser;
  try {
    authUser = await auth.getUser(userId);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
    if (code === "auth/user-not-found") return null;
    throw error;
  }

  const firestore = getFirebaseAdminFirestore();
  const userRef = firestore.collection("users").doc(userId);
  const [privateSnapshot, publicSnapshot, entries, catalog, statsSnapshot] = await Promise.all([
    userRef.get(),
    firestore.collection("publicProfiles").doc(userId).get(),
    collectionRepository.getAllEntries(userId),
    getCollectionCatalog(locale),
    collectionRepository.stats(userId).get(),
  ]);
  const privateUser = (privateSnapshot.data() ?? {}) as PrivateUserData;
  const publicProfile = publicSnapshot.exists
    ? ({ id: publicSnapshot.id, ...publicSnapshot.data() } as PublicUserProfileDocument)
    : null;
  const catalogById = new Map(catalog.map((card) => [card.id, card]));
  const collectionItems = entries
    .filter((entry) => entry.ownedQuantity > 0)
    .map((entry) => {
      const card = catalogById.get(entry.cardId);
      return {
        cardId: entry.cardId,
        number: card?.number ?? null,
        name: card?.name ?? entry.cardId,
        seasonName: card?.season?.name ?? null,
        ...(card?.artwork.url ? { artworkUrl: card.artwork.url } : {}),
        ownedQuantity: entry.ownedQuantity,
        duplicateQuantity: entry.duplicateQuantity,
        tradeQuantity: entry.tradeQuantity,
      };
    })
    .sort((left, right) =>
      (left.seasonName ?? "").localeCompare(right.seasonName ?? "", locale) ||
      (left.number ?? Number.POSITIVE_INFINITY) -
        (right.number ?? Number.POSITIVE_INFINITY) ||
      left.name.localeCompare(right.name, locale),
    );
  const collectionStats = calculateCollectionStats(
    entries,
    catalog.length,
    dateIso(statsSnapshot.get("updatedAt")),
  );
  const claims = authUser.customClaims ?? {};
  const username = publicProfile?.username ?? privateUser.username ?? privateUser.pseudonym ?? "";
  const displayName = publicProfile?.displayName ?? privateUser.displayName ?? authUser.displayName ?? "";

  return {
    uid: authUser.uid,
    email: authUser.email ?? null,
    emailVerified: authUser.emailVerified,
    disabled: authUser.disabled,
    username,
    displayName,
    bio: publicProfile?.bio ?? "",
    ...(publicProfile?.avatarUrl ? { avatarUrl: publicProfile.avatarUrl } : {}),
    role: roleFromClaims(claims),
    roles: stringRoles(claims.roles ?? privateUser.roles),
    onboardingCompleted:
      claims.onboardingCompleted === true || privateUser.onboardingCompleted === true,
    preferredLocale:
      typeof privateUser.preferredLocale === "string"
        ? privateUser.preferredLocale
        : null,
    createdAtIso:
      authDateIso(authUser.metadata.creationTime) ?? dateIso(privateUser.createdAt),
    lastSignInAtIso: authDateIso(authUser.metadata.lastSignInTime),
    providers: [...new Set(authUser.providerData.map((provider) => provider.providerId))],
    supportsPassword: authUser.providerData.some(
      (provider) => provider.providerId === "password",
    ),
    isCurrentUser: session.uid === authUser.uid,
    profileStats: {
      followersCount: Number(publicProfile?.stats?.followersCount ?? 0),
      followingCount: Number(publicProfile?.stats?.followingCount ?? 0),
      decksCount: Number(publicProfile?.stats?.decksCount ?? 0),
    },
    visibility: publicProfile?.visibility ?? null,
    collection: {
      items: collectionItems,
      uniqueOwnedCards: collectionStats.uniqueOwnedCards,
      totalOwnedCopies: collectionStats.totalOwnedCopies,
      duplicateCopies: collectionStats.duplicateCopies,
      tradeCopies: collectionStats.tradeCopies,
      completionPercentage: collectionStats.completionPercentage,
    },
  };
}

export async function updateModeratedUser(
  userId: string,
  input: {
    username: string;
    displayName: string;
    bio: string;
    role: ModeratedUserRole;
  },
) {
  await requireAdminSession();
  const auth = getFirebaseAdminAuth();
  const firestore = getFirebaseAdminFirestore();
  const publicProfileRef = firestore.collection("publicProfiles").doc(userId);
  const publicSnapshot = await publicProfileRef.get();

  if (!publicSnapshot.exists) {
    await createCommunityProfile(userId, {
      username: input.username,
      displayName: input.displayName,
    });
  }

  const profileSnapshot = await publicProfileRef.get();
  const profile = profileSnapshot.data() as PublicUserProfileDocument | undefined;
  if (!profile) throw new Error("PROFILE_NOT_FOUND");
  const profileResult = await updatePublicProfile(userId, {
    username: input.username,
    displayName: input.displayName,
    bio: input.bio,
    avatarUrl: profile.avatarUrl ?? "",
    avatarStoragePath: profile.avatarStoragePath ?? "",
    bannerUrl: profile.bannerUrl ?? "",
    bannerStoragePath: profile.bannerStoragePath ?? "",
  });

  const authUser = await auth.getUser(userId);
  const existingClaims = authUser.customClaims ?? {};
  const previousRole = roleFromClaims(existingClaims);
  const roles = Array.from(
    new Set([
      "user",
      ...stringRoles(existingClaims.roles).filter((role) => role !== "admin"),
      ...(input.role === "admin" ? ["admin"] : []),
    ]),
  );
  await auth.setCustomUserClaims(userId, {
    ...existingClaims,
    admin: input.role === "admin",
    role: input.role,
    roles,
    onboardingCompleted: true,
  });
  await firestore.collection("users").doc(userId).set(
    {
      role: input.role,
      roles,
      onboardingCompleted: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  if (
    previousRole !== input.role ||
    existingClaims.onboardingCompleted !== true
  ) {
    await auth.revokeRefreshTokens(userId);
  }

  return profileResult;
}
