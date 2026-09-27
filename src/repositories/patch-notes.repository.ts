import "server-only";

import { FieldPath, Timestamp, type Query } from "firebase-admin/firestore";

import type { PatchNoteDocument } from "@/features/patch-notes/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";

const PAGE_SIZE = 12;

function encodeCursor(timestamp: Timestamp, id: string) {
  return Buffer.from(`${timestamp.toMillis()}:${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor?: string) {
  if (!cursor) return null;
  try {
    const [millis, id] = Buffer.from(cursor, "base64url").toString("utf8").split(":");
    return Number.isFinite(Number(millis)) && id ? { timestamp: Timestamp.fromMillis(Number(millis)), id } : null;
  } catch {
    return null;
  }
}

function documentValue(document: FirebaseFirestore.DocumentSnapshot) {
  return document.exists ? ({ id: document.id, ...document.data() } as PatchNoteDocument) : null;
}

export const patchNotesRepository = {
  collection() {
    return getFirebaseAdminFirestore().collection(FIRESTORE_COLLECTIONS.patchNotes);
  },

  reference(id: string) {
    return this.collection().doc(id);
  },

  async getById(id: string) {
    return documentValue(await this.reference(id).get());
  },

  async getBySlug(slug: string) {
    const snapshot = await this.collection().where("slug", "==", slug).limit(1).get();
    return snapshot.empty ? null : documentValue(snapshot.docs[0]);
  },

  async createWithId(id: string, data: Omit<PatchNoteDocument, "id">) {
    await this.reference(id).create(data);
    return { id, ...data };
  },

  async update(id: string, data: Record<string, unknown>) {
    await this.reference(id).update(data);
  },

  async remove(id: string) {
    await this.reference(id).delete();
  },

  async listAdmin(limit = 100) {
    const snapshot = await this.collection().orderBy("updatedAt", "desc").limit(limit).get();
    return snapshot.docs.map((document) => documentValue(document)!).filter(Boolean);
  },

  async listPublic(cursor?: string, limit = PAGE_SIZE) {
    const now = Timestamp.now();
    const decoded = decodeCursor(cursor);
    let query: Query = this.collection()
      .where("status", "in", ["published", "scheduled"])
      .where("visibleAt", "<=", now)
      .orderBy("visibleAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (decoded) query = query.startAfter(decoded.timestamp, decoded.id);
    try {
      const snapshot = await query.limit(limit + 1).get();
      const documents = snapshot.docs.slice(0, limit);
      const last = documents.at(-1);
      return {
        items: documents.map((document) => documentValue(document)!).filter(Boolean),
        nextCursor: snapshot.docs.length > limit && last
          ? encodeCursor(last.get("visibleAt") as Timestamp, last.id)
          : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/requires an index/i.test(message)) throw error;
      const snapshot = await this.collection().where("status", "in", ["published", "scheduled"]).limit(100).get();
      const afterMillis = decoded?.timestamp.toMillis() ?? Number.POSITIVE_INFINITY;
      const items = snapshot.docs
        .filter((document) => {
          const visibleAt = document.get("visibleAt");
          return visibleAt instanceof Timestamp && visibleAt.toMillis() <= now.toMillis() && (
            visibleAt.toMillis() < afterMillis || (visibleAt.toMillis() === afterMillis && document.id < (decoded?.id ?? ""))
          );
        })
        .sort((left, right) => {
          const difference = (right.get("visibleAt") as Timestamp).toMillis() - (left.get("visibleAt") as Timestamp).toMillis();
          return difference || right.id.localeCompare(left.id);
        });
      const documents = items.slice(0, limit);
      const last = documents.at(-1);
      return {
        items: documents.map((document) => documentValue(document)!).filter(Boolean),
        nextCursor: items.length > limit && last ? encodeCursor(last.get("visibleAt") as Timestamp, last.id) : undefined,
      };
    }
  },
};
