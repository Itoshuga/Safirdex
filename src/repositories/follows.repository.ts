import "server-only";

import { FieldPath, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export interface FollowRelationDocument {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  createdAt: Timestamp;
}

function decodeCursor(cursor: string | undefined) {
  if (!cursor) return null;
  try {
    const [millis, id] = Buffer.from(cursor, "base64url").toString("utf8").split(":");
    const timestamp = Number(millis);
    return Number.isFinite(timestamp) && id ? { timestamp, id } : null;
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Timestamp, id: string) {
  return Buffer.from(`${createdAt.toMillis()}:${id}`, "utf8").toString("base64url");
}

export const followsRepository = {
  followingReference(viewerId: string, targetId: string) {
    return getFirebaseAdminFirestore()
      .collection("users")
      .doc(viewerId)
      .collection("following")
      .doc(targetId);
  },

  followerReference(targetId: string, viewerId: string) {
    return getFirebaseAdminFirestore()
      .collection("users")
      .doc(targetId)
      .collection("followers")
      .doc(viewerId);
  },

  async isFollowing(viewerId: string, targetId: string) {
    return (await this.followingReference(viewerId, targetId).get()).exists;
  },

  async getFollowingStates(viewerId: string | null, targetIds: string[]) {
    if (!viewerId || targetIds.length === 0) return new Set<string>();
    const uniqueIds = [...new Set(targetIds)].filter((id) => id !== viewerId);
    const snapshots = await getFirebaseAdminFirestore().getAll(
      ...uniqueIds.map((id) => this.followingReference(viewerId, id)),
    );
    return new Set(snapshots.filter((snapshot) => snapshot.exists).map((snapshot) => snapshot.id));
  },

  async list(
    userId: string,
    kind: "followers" | "following",
    cursor?: string,
    limit = 20,
  ) {
    let query = getFirebaseAdminFirestore()
      .collection("users")
      .doc(userId)
      .collection(kind)
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .limit(limit + 1);
    const decoded = decodeCursor(cursor);
    if (decoded) {
      query = query.startAfter(Timestamp.fromMillis(decoded.timestamp), decoded.id);
    }
    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > limit;
    const docs = snapshot.docs.slice(0, limit);
    const items = docs.map((document) => ({
      id: document.id,
      ...(document.data() as FollowRelationDocument),
    }));
    const last = docs.at(-1);
    return {
      items,
      nextCursor:
        hasMore && last
          ? encodeCursor(last.get("createdAt") as Timestamp, last.id)
          : undefined,
    };
  },
};

