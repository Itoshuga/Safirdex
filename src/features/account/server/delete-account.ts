import "server-only";

import { getFirebaseAdminAuth, getFirebaseAdminFirestore, getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { unfollowUser } from "@/features/community/server/follow-service";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";

const DELETE_BATCH_SIZE = 400;

async function inChunks<T>(items: T[], operation: (item: T) => Promise<unknown>) {
  for (let index = 0; index < items.length; index += 10) {
    await Promise.all(items.slice(index, index + 10).map(operation));
  }
}

async function deleteReferences(references: FirebaseFirestore.DocumentReference[]) {
  const firestore = getFirebaseAdminFirestore();
  for (let index = 0; index < references.length; index += DELETE_BATCH_SIZE) {
    const batch = firestore.batch();
    references.slice(index, index + DELETE_BATCH_SIZE).forEach((reference) => batch.delete(reference));
    await batch.commit();
  }
}

export async function deleteSafirdexAccount(userId: string, confirmation: string) {
  const firestore = getFirebaseAdminFirestore();
  const profile = await publicProfilesRepository.getById(userId);
  const expectedConfirmation = profile?.username ?? "DELETE";
  if (confirmation.trim().toLowerCase() !== expectedConfirmation.toLowerCase()) {
    throw new Error("CONFIRMATION_MISMATCH");
  }

  const userRef = firestore.collection("users").doc(userId);
  const [following, followers] = await Promise.all([
    userRef.collection("following").select().get(),
    userRef.collection("followers").select().get(),
  ]);

  await inChunks(following.docs, (relation) => unfollowUser(userId, relation.id));
  await inChunks(followers.docs, (relation) => unfollowUser(relation.id, userId));

  const [activities, decks, usernamesByUserId, usernamesByLegacyUid] = await Promise.all([
    firestore.collection("communityActivities").where("actorId", "==", userId).get(),
    firestore.collection("decks").where("authorId", "==", userId).get(),
    firestore.collection("usernames").where("userId", "==", userId).get(),
    firestore.collection("usernames").where("uid", "==", userId).get(),
  ]);
  const references = [
    ...activities.docs.map((document) => document.ref),
    ...decks.docs.map((document) => document.ref),
    ...usernamesByUserId.docs.map((document) => document.ref),
    ...usernamesByLegacyUid.docs.map((document) => document.ref),
  ];
  await deleteReferences([...new Map(references.map((reference) => [reference.path, reference])).values()]);

  await getFirebaseAdminStorage().bucket().deleteFiles({ prefix: `users/${userId}/` });

  await Promise.all([
    firestore.recursiveDelete(firestore.collection("userFeeds").doc(userId)),
    firestore.recursiveDelete(userRef),
  ]);
  await publicProfilesRepository.reference(userId).delete();
  await getFirebaseAdminAuth().deleteUser(userId);
  return { usernameNormalized: profile?.usernameNormalized };
}
