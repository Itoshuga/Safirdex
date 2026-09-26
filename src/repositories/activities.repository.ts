import "server-only";

import { FieldPath, Timestamp, type Query } from "firebase-admin/firestore";

import type { CommunityActivityDocument } from "@/features/community/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

const PAGE_SIZE = 20;

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

async function execute(query: Query, cursor?: string) {
  const decoded = decodeCursor(cursor);
  const paginated = decoded
    ? query.startAfter(Timestamp.fromMillis(decoded.timestamp), decoded.id)
    : query;
  let snapshot;
  try {
    snapshot = await paginated.limit(PAGE_SIZE + 1).get();
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
    if (code === 9 || code === "failed-precondition") return { items: [] };
    throw error;
  }
  const hasMore = snapshot.docs.length > PAGE_SIZE;
  const docs = snapshot.docs.slice(0, PAGE_SIZE);
  const items = docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as CommunityActivityDocument[];
  const last = docs.at(-1);
  return {
    items,
    nextCursor:
      hasMore && last
        ? encodeCursor(last.get("createdAt") as Timestamp, last.id)
        : undefined,
  };
}

function ordered(query: Query) {
  return query
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "desc");
}

export const activitiesRepository = {
  collection() {
    return getFirebaseAdminFirestore().collection("communityActivities");
  },

  async discover(cursor?: string) {
    return execute(
      ordered(
        this.collection()
          .where("published", "==", true)
          .where("visibility", "==", "public"),
      ),
      cursor,
    );
  },

  async following(userId: string, cursor?: string) {
    return execute(
      ordered(
        getFirebaseAdminFirestore()
          .collection("userFeeds")
          .doc(userId)
          .collection("items")
          .where("published", "==", true),
      ),
      cursor,
    );
  },

  async byActor(actorId: string, includePrivate: boolean, cursor?: string) {
    let query: Query = this.collection().where("actorId", "==", actorId);
    if (!includePrivate) {
      query = query
        .where("published", "==", true)
        .where("visibility", "==", "public");
    }
    return execute(ordered(query), cursor);
  },
};
