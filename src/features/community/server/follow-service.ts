import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { followsRepository } from "@/repositories/follows.repository";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";

function relationSnapshot(profile: Awaited<ReturnType<typeof publicProfilesRepository.getById>>) {
  if (!profile) throw new Error("PROFILE_NOT_FOUND");
  return {
    userId: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    ...(profile.bio ? { bio: profile.bio } : {}),
    followersCount: profile.stats.followersCount,
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function backfillFeed(viewerId: string, targetId: string) {
  const firestore = getFirebaseAdminFirestore();
  const activities = await firestore
    .collection("communityActivities")
    .where("actorId", "==", targetId)
    .where("published", "==", true)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
  if (activities.empty) return;
  const batch = firestore.batch();
  activities.docs.forEach((activity) => {
    batch.set(
      firestore.collection("userFeeds").doc(viewerId).collection("items").doc(activity.id),
      activity.data(),
    );
  });
  await batch.commit();
}

async function removeFeedItems(viewerId: string, targetId: string) {
  const firestore = getFirebaseAdminFirestore();
  const items = await firestore
    .collection("userFeeds")
    .doc(viewerId)
    .collection("items")
    .where("actorId", "==", targetId)
    .get();
  if (items.empty) return;
  const batch = firestore.batch();
  items.docs.forEach((item) => batch.delete(item.ref));
  await batch.commit();
}

export async function followUser(viewerId: string, targetId: string) {
  if (viewerId === targetId) throw new Error("CANNOT_FOLLOW_SELF");
  const firestore = getFirebaseAdminFirestore();
  const viewerRef = publicProfilesRepository.reference(viewerId);
  const targetRef = publicProfilesRepository.reference(targetId);
  const followingRef = followsRepository.followingReference(viewerId, targetId);
  const followerRef = followsRepository.followerReference(targetId, viewerId);

  const changed = await firestore.runTransaction(async (transaction) => {
    const [viewerSnapshot, targetSnapshot, followingSnapshot] = await Promise.all([
      transaction.get(viewerRef),
      transaction.get(targetRef),
      transaction.get(followingRef),
    ]);
    if (!viewerSnapshot.exists || !targetSnapshot.exists) throw new Error("PROFILE_NOT_FOUND");
    if (followingSnapshot.exists) return false;
    const viewer = { id: viewerSnapshot.id, ...viewerSnapshot.data() } as NonNullable<
      Awaited<ReturnType<typeof publicProfilesRepository.getById>>
    >;
    const target = { id: targetSnapshot.id, ...targetSnapshot.data() } as typeof viewer;
    if (!target.visibility.publicProfile) throw new Error("PROFILE_NOT_FOUND");
    transaction.create(followingRef, relationSnapshot(target));
    transaction.create(followerRef, relationSnapshot(viewer));
    transaction.update(viewerRef, {
      "stats.followingCount": viewer.stats.followingCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(targetRef, {
      "stats.followersCount": target.stats.followersCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
  if (changed) await backfillFeed(viewerId, targetId);
  return changed;
}

export async function unfollowUser(viewerId: string, targetId: string) {
  if (viewerId === targetId) return false;
  const firestore = getFirebaseAdminFirestore();
  const viewerRef = publicProfilesRepository.reference(viewerId);
  const targetRef = publicProfilesRepository.reference(targetId);
  const followingRef = followsRepository.followingReference(viewerId, targetId);
  const followerRef = followsRepository.followerReference(targetId, viewerId);

  const changed = await firestore.runTransaction(async (transaction) => {
    const [viewerSnapshot, targetSnapshot, followingSnapshot] = await Promise.all([
      transaction.get(viewerRef),
      transaction.get(targetRef),
      transaction.get(followingRef),
    ]);
    if (!followingSnapshot.exists) return false;
    transaction.delete(followingRef);
    transaction.delete(followerRef);
    if (viewerSnapshot.exists) {
      const count = Number(viewerSnapshot.get("stats.followingCount") ?? 0);
      transaction.update(viewerRef, {
        "stats.followingCount": Math.max(0, count - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    if (targetSnapshot.exists) {
      const count = Number(targetSnapshot.get("stats.followersCount") ?? 0);
      transaction.update(targetRef, {
        "stats.followersCount": Math.max(0, count - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return true;
  });
  if (changed) await removeFeedItems(viewerId, targetId);
  return changed;
}

