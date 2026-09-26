"use server";

import { revalidatePath, updateTag } from "next/cache";

import type { CommunityActionState } from "@/features/community/action-state";
import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import { followUser, unfollowUser } from "@/features/community/server/follow-service";
import {
  createCommunityProfile,
  normalizeUsername,
  resolvePublicProfile,
  updateProfilePrivacy,
  updatePublicProfile,
} from "@/features/community/server/profile-service";
import { getUserSession } from "@/lib/auth/user-session";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

function invalidateProfiles(usernames: string[]) {
  updateTag(COMMUNITY_CACHE_TAGS.profiles);
  usernames.forEach((username) =>
    updateTag(COMMUNITY_CACHE_TAGS.profile(username.toLowerCase())),
  );
  revalidatePath("/[locale]/community", "page");
  revalidatePath("/[locale]/account", "page");
  revalidatePath("/[locale]/user/[username]", "page");
}

function isOwnedStorageAsset(urlValue: string, storagePath: string) {
  if (!urlValue && !storagePath) return true;
  if (!urlValue || !storagePath) return false;
  try {
    const url = new URL(urlValue);
    const decodedPath = decodeURIComponent(url.pathname);
    return (url.protocol === "https:" || url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
      decodedPath.endsWith(`/o/${storagePath}`);
  } catch {
    return false;
  }
}

export async function updateProfileAction(
  _previous: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const session = await getUserSession();
  if (!session) return { status: "error", code: "AUTH_REQUIRED" };
  const avatarStoragePath = String(formData.get("avatarStoragePath") ?? "");
  const bannerStoragePath = String(formData.get("bannerStoragePath") ?? "");
  const avatarUrl = String(formData.get("avatarUrl") ?? "");
  const bannerUrl = String(formData.get("bannerUrl") ?? "");
  if (
    (avatarStoragePath && avatarStoragePath !== `users/${session.uid}/avatar.webp`) ||
    (bannerStoragePath && bannerStoragePath !== `users/${session.uid}/banner.webp`) ||
    !isOwnedStorageAsset(avatarUrl, avatarStoragePath) ||
    !isOwnedStorageAsset(bannerUrl, bannerStoragePath)
  ) {
    return { status: "error", code: "INVALID_ASSET_PATH" };
  }

  try {
    const result = await updatePublicProfile(session.uid, {
      username: formData.get("username"),
      displayName: formData.get("displayName"),
      bio: formData.get("bio"),
      avatarUrl,
      avatarStoragePath,
      bannerUrl,
      bannerStoragePath,
    });
    invalidateProfiles([result.usernameNormalized, result.previousUsernameNormalized]);
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      code: error instanceof Error && error.message === "USERNAME_TAKEN"
        ? "USERNAME_TAKEN"
        : "INVALID_PROFILE",
    };
  }
}

export async function createCommunityProfileAction(
  _previous: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const session = await getUserSession();
  if (!session) return { status: "error", code: "AUTH_REQUIRED" };
  try {
    const profile = await createCommunityProfile(session.uid, {
      username: String(formData.get("username") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
    });
    if (!profile) throw new Error("PROFILE_NOT_FOUND");
    invalidateProfiles([profile.usernameNormalized]);
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      code: error instanceof Error && error.message === "USERNAME_TAKEN"
        ? "USERNAME_TAKEN"
        : "INVALID_PROFILE",
    };
  }
}

export async function updatePrivacyAction(
  _previous: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const session = await getUserSession();
  if (!session) return { status: "error", code: "AUTH_REQUIRED" };
  try {
    const profile = await updateProfilePrivacy(session.uid, {
      publicProfile: formData.get("publicProfile") === "on",
      decks: formData.get("decks") === "on" ? "public" : "private",
      collection: formData.get("collection") === "on" ? "public" : "private",
      activity: formData.get("activity") === "on" ? "public" : "private",
    });
    invalidateProfiles([profile.usernameNormalized]);
    updateTag(COMMUNITY_CACHE_TAGS.discover);
    return { status: "success" };
  } catch {
    return { status: "error", code: "PRIVACY_UPDATE_FAILED" };
  }
}

export async function setFollowStateAction(input: {
  username: string;
  following: boolean;
}) {
  const session = await getUserSession();
  if (!session) return { ok: false, code: "AUTH_REQUIRED" } as const;
  const resolved = await resolvePublicProfile(input.username);
  if (!resolved || !resolved.profile.visibility.publicProfile) {
    return { ok: false, code: "PROFILE_NOT_FOUND" } as const;
  }
  if (resolved.profile.id === session.uid) {
    return { ok: false, code: "CANNOT_FOLLOW_SELF" } as const;
  }
  try {
    if (input.following) {
      await followUser(session.uid, resolved.profile.id);
    } else {
      await unfollowUser(session.uid, resolved.profile.id);
    }
    const viewer = await getFirebaseAdminFirestore()
      .collection("publicProfiles")
      .doc(session.uid)
      .get();
    invalidateProfiles([
      resolved.profile.usernameNormalized,
      String(viewer.get("usernameNormalized") ?? ""),
    ]);
    return { ok: true, following: input.following } as const;
  } catch {
    return { ok: false, code: "FOLLOW_FAILED" } as const;
  }
}

export async function checkUsernameAvailabilityAction(username: string) {
  const session = await getUserSession();
  if (!session) return { available: false, code: "AUTH_REQUIRED" } as const;
  try {
    const normalized = normalizeUsername(username);
    const snapshot = await getFirebaseAdminFirestore()
      .collection("usernames")
      .doc(normalized)
      .get();
    const owner =
      (snapshot.get("userId") as string | undefined) ??
      (snapshot.get("uid") as string | undefined);
    return { available: !snapshot.exists || owner === session.uid } as const;
  } catch {
    return { available: false, code: "INVALID_USERNAME" } as const;
  }
}
