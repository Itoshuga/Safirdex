import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import type {
  CollectionActivityPayload,
  CommunityActivityDocument,
  CommunityActivityType,
  CommunityActivityVisibility,
  DeckActivityPayload,
  PublicUserProfileDocument,
} from "@/features/community/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";

const MAX_BATCH_WRITES = 450;

function activityData(activity: CommunityActivityDocument) {
  const { id, ...data } = activity;
  void id;
  return data;
}

async function writeInChunks(
  operations: Array<(batch: FirebaseFirestore.WriteBatch) => void>,
) {
  const firestore = getFirebaseAdminFirestore();
  for (let index = 0; index < operations.length; index += MAX_BATCH_WRITES) {
    const batch = firestore.batch();
    operations.slice(index, index + MAX_BATCH_WRITES).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

async function createActivity({
  actorId,
  type,
  visibility,
  entityKey,
  payload,
  requiredSection,
}: {
  actorId: string;
  type: CommunityActivityType;
  visibility: CommunityActivityVisibility;
  entityKey: string;
  payload: DeckActivityPayload | CollectionActivityPayload;
  requiredSection: "decks" | "collection";
}) {
  const profile = await publicProfilesRepository.getById(actorId);
  if (
    !profile ||
    !profile.visibility.publicProfile ||
    profile.visibility.activity === "private" ||
    profile.visibility[requiredSection] === "private"
  ) {
    return null;
  }

  const firestore = getFirebaseAdminFirestore();
  const reference = firestore.collection("communityActivities").doc();
  const createdAt = Timestamp.now();
  const activity: CommunityActivityDocument = {
    id: reference.id,
    actorId,
    actor: {
      userId: actorId,
      username: profile.username,
      displayName: profile.displayName,
      ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    },
    type,
    visibility,
    published: true,
    entityKey,
    createdAt,
    payload,
  };

  const followers = await firestore
    .collection("users")
    .doc(actorId)
    .collection("followers")
    .select()
    .get();
  const recipients = new Set([actorId, ...followers.docs.map((document) => document.id)]);
  const data = activityData(activity);
  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [
    (batch) => batch.create(reference, data),
    ...[...recipients].map((userId) => (batch: FirebaseFirestore.WriteBatch) =>
      batch.set(
        firestore.collection("userFeeds").doc(userId).collection("items").doc(reference.id),
        data,
      ),
    ),
  ];
  await writeInChunks(operations);
  return activity;
}

export async function recordDeckCreatedActivity(
  actorId: string,
  payload: DeckActivityPayload,
  visibility: CommunityActivityVisibility = "public",
) {
  const existing = await getFirebaseAdminFirestore()
    .collection("communityActivities")
    .where("actorId", "==", actorId)
    .where("entityKey", "==", `deck:${payload.deckId}`)
    .limit(1)
    .get();
  if (!existing.empty) return null;
  return createActivity({
    actorId,
    type: "deck_created",
    visibility,
    entityKey: `deck:${payload.deckId}`,
    payload,
    requiredSection: "decks",
  });
}

export async function setDeckActivityPublished(
  actorId: string,
  deckId: string,
  deckIsPublic: boolean,
) {
  const [profile, activities] = await Promise.all([
    publicProfilesRepository.getById(actorId),
    getFirebaseAdminFirestore()
      .collection("communityActivities")
      .where("actorId", "==", actorId)
      .where("entityKey", "==", `deck:${deckId}`)
      .get(),
  ]);
  if (activities.empty) return;
  const published = Boolean(
    deckIsPublic &&
    profile?.visibility.publicProfile &&
    profile.visibility.activity === "public" &&
    profile.visibility.decks === "public",
  );
  const firestore = getFirebaseAdminFirestore();
  const followers = await firestore
    .collection("users")
    .doc(actorId)
    .collection("followers")
    .select()
    .get();
  const recipients = new Set([actorId, ...followers.docs.map((document) => document.id)]);
  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  for (const activity of activities.docs) {
    operations.push((batch) => batch.update(activity.ref, { published }));
    for (const userId of recipients) {
      operations.push((batch) => batch.set(
        firestore.collection("userFeeds").doc(userId).collection("items").doc(activity.id),
        { published },
        { merge: true },
      ));
    }
  }
  await writeInChunks(operations);
}

export function recordSignificantDeckUpdateActivity(
  actorId: string,
  payload: DeckActivityPayload,
  visibility: CommunityActivityVisibility = "public",
) {
  return createActivity({
    actorId,
    type: "deck_updated",
    visibility,
    entityKey: `deck:${payload.deckId}`,
    payload,
    requiredSection: "decks",
  });
}

export function recordCollectionUpdatedActivity(
  actorId: string,
  payload: CollectionActivityPayload,
  visibility: CommunityActivityVisibility = "public",
) {
  return createActivity({
    actorId,
    type: "collection_updated",
    visibility,
    entityKey: `collection:${actorId}`,
    payload: { ...payload, cards: payload.cards.slice(0, 4) },
    requiredSection: "collection",
  });
}

export async function setActorActivitiesPublished(
  profile: PublicUserProfileDocument,
) {
  const firestore = getFirebaseAdminFirestore();
  const activities = await firestore
    .collection("communityActivities")
    .where("actorId", "==", profile.id)
    .get();
  if (activities.empty) return;
  const followers = await firestore
    .collection("users")
    .doc(profile.id)
    .collection("followers")
    .select()
    .get();
  const recipients = new Set([profile.id, ...followers.docs.map((document) => document.id)]);
  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  for (const activity of activities.docs) {
    const type = activity.get("type") as CommunityActivityType;
    const sectionIsPublic = type === "collection_updated"
      ? profile.visibility.collection === "public"
      : profile.visibility.decks === "public";
    const published = profile.visibility.publicProfile &&
      profile.visibility.activity === "public" &&
      sectionIsPublic;
    operations.push((batch) => batch.update(activity.ref, { published }));
    for (const userId of recipients) {
      const feedRef = firestore
        .collection("userFeeds")
        .doc(userId)
        .collection("items")
        .doc(activity.id);
      operations.push((batch) => batch.set(feedRef, { published }, { merge: true }));
    }
  }
  await writeInChunks(operations);
}

export async function removeActivitiesForEntity(actorId: string, entityKey: string) {
  const firestore = getFirebaseAdminFirestore();
  const activities = await firestore
    .collection("communityActivities")
    .where("actorId", "==", actorId)
    .where("entityKey", "==", entityKey)
    .get();
  if (activities.empty) return;
  const followers = await firestore
    .collection("users")
    .doc(actorId)
    .collection("followers")
    .select()
    .get();
  const recipients = new Set([actorId, ...followers.docs.map((document) => document.id)]);
  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  for (const activity of activities.docs) {
    operations.push((batch) => batch.delete(activity.ref));
    for (const userId of recipients) {
      operations.push((batch) =>
        batch.delete(
          firestore.collection("userFeeds").doc(userId).collection("items").doc(activity.id),
        ),
      );
    }
  }
  await writeInChunks(operations);
}
