import "server-only";

import { FieldPath, type QueryDocumentSnapshot } from "firebase-admin/firestore";

import type { PublicUserProfileDocument } from "@/features/community/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const COLLECTION = "publicProfiles";

function fromSnapshot(snapshot: QueryDocumentSnapshot): PublicUserProfileDocument {
  return { id: snapshot.id, ...snapshot.data() } as PublicUserProfileDocument;
}

function isIndexUnavailable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    ((error as { code?: unknown }).code === 9 ||
      (error as { code?: unknown }).code === "failed-precondition");
}

export const publicProfilesRepository = {
  reference(userId: string) {
    return getFirebaseAdminFirestore().collection(COLLECTION).doc(userId);
  },

  async getById(userId: string) {
    const snapshot = await this.reference(userId).get();
    return snapshot.exists
      ? ({ id: snapshot.id, ...snapshot.data() } as PublicUserProfileDocument)
      : null;
  },

  async getManyByIds(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return [];
    const snapshots = await getFirebaseAdminFirestore().getAll(
      ...uniqueIds.map((userId) => this.reference(userId)),
    );
    return snapshots.flatMap((snapshot) =>
      snapshot.exists
        ? [{ id: snapshot.id, ...snapshot.data() } as PublicUserProfileDocument]
        : [],
    );
  },

  async getByNormalizedUsername(usernameNormalized: string) {
    const snapshot = await getFirebaseAdminFirestore()
      .collection(COLLECTION)
      .where("usernameNormalized", "==", usernameNormalized)
      .limit(1)
      .get();
    return snapshot.empty ? null : fromSnapshot(snapshot.docs[0]);
  },

  async searchByUsernamePrefix(prefix: string, limit = 20) {
    try {
      const snapshot = await getFirebaseAdminFirestore()
        .collection(COLLECTION)
        .where("visibility.publicProfile", "==", true)
        .orderBy("usernameNormalized")
        .startAt(prefix)
        .endAt(`${prefix}\uf8ff`)
        .limit(limit)
        .get();
      return snapshot.docs.map(fromSnapshot);
    } catch (error) {
      if (isIndexUnavailable(error)) return [];
      throw error;
    }
  },

  async searchByDisplayNamePrefix(prefix: string, limit = 20) {
    try {
      const snapshot = await getFirebaseAdminFirestore()
        .collection(COLLECTION)
        .where("visibility.publicProfile", "==", true)
        .orderBy("displayNameNormalized")
        .startAt(prefix)
        .endAt(`${prefix}\uf8ff`)
        .limit(limit)
        .get();
      return snapshot.docs.map(fromSnapshot);
    } catch (error) {
      if (isIndexUnavailable(error)) return [];
      throw error;
    }
  },

  async discover(limit = 8) {
    try {
      const snapshot = await getFirebaseAdminFirestore()
        .collection(COLLECTION)
        .where("visibility.publicProfile", "==", true)
        .orderBy("joinedAt", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(limit)
        .get();
      return snapshot.docs.map(fromSnapshot);
    } catch (error) {
      if (isIndexUnavailable(error)) return [];
      throw error;
    }
  },
};
