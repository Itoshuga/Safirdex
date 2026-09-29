import "server-only";

import { FieldPath, Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";

import {
  collectionEntryState,
  emptyCollectionEntry,
} from "@/features/collection/domain";
import type {
  CardTraderPage,
  CardTraderView,
  CollectionEntryState,
  PublicCardTradeDocument,
  TradePrivacySettings,
} from "@/features/collection/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";

const DEFAULT_TRADE_SETTINGS: TradePrivacySettings = {
  showTradesPublicly: false,
  showDiscordForTrades: false,
  discord: "",
};

const INDEX_BUILD_FALLBACK_LIMIT = 500;
let didWarnAboutTradeIndex = false;

function isUnavailableIndex(error: unknown) {
  const code = error && typeof error === "object" && "code" in error
    ? (error as { code?: unknown }).code
    : undefined;
  const message = error instanceof Error ? error.message : "";
  return code === 9 ||
    code === "failed-precondition" ||
    /requires an index|index is currently building/i.test(message);
}

function updatedAtMillis(document: QueryDocumentSnapshot) {
  const value = document.get("updatedAt");
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function sortTradeDocuments(
  left: QueryDocumentSnapshot,
  right: QueryDocumentSnapshot,
) {
  return updatedAtMillis(right) - updatedAtMillis(left) ||
    right.id.localeCompare(left.id);
}

function isAfterTradeCursor(
  document: QueryDocumentSnapshot,
  cursor: TradeCursor,
) {
  const millis = updatedAtMillis(document);
  return millis < cursor.updatedAtMillis ||
    (millis === cursor.updatedAtMillis && document.id < cursor.id);
}

function entryFromSnapshot(
  snapshot: FirebaseFirestore.DocumentSnapshot,
): CollectionEntryState {
  if (!snapshot.exists) return emptyCollectionEntry(snapshot.id);
  const ownedQuantity = Number(
    snapshot.get("ownedQuantity") ?? snapshot.get("quantity") ?? 0,
  );
  return collectionEntryState(
    snapshot.id,
    ownedQuantity,
    Number(snapshot.get("tradeQuantity") ?? 0),
  );
}

function tradeSettingsFromData(data: unknown): TradePrivacySettings {
  const value = data && typeof data === "object"
    ? (data as Record<string, unknown>)
    : {};
  const discord = typeof value.discord === "string" ? value.discord : "";
  return {
    showTradesPublicly: value.showTradesPublicly === true,
    showDiscordForTrades: value.showDiscordForTrades === true,
    discord,
  };
}

interface TradeCursor {
  updatedAtMillis: number;
  id: string;
}

function encodeCursor(cursor: TradeCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<TradeCursor>;
    return typeof parsed.updatedAtMillis === "number" &&
      typeof parsed.id === "string"
      ? (parsed as TradeCursor)
      : null;
  } catch {
    return null;
  }
}

function traderFromSnapshot(
  snapshot: QueryDocumentSnapshot,
): CardTraderView | null {
  const data = snapshot.data() as Partial<PublicCardTradeDocument>;
  if (
    typeof data.userId !== "string" ||
    typeof data.tradeQuantity !== "number" ||
    !data.user ||
    typeof data.user.username !== "string" ||
    typeof data.user.displayName !== "string"
  ) {
    return null;
  }
  return {
    userId: data.userId,
    username: data.user.username,
    displayName: data.user.displayName,
    ...(data.user.avatarUrl ? { avatarUrl: data.user.avatarUrl } : {}),
    tradeQuantity: data.tradeQuantity,
    ...(typeof data.discord === "string" && data.discord
      ? { discord: data.discord }
      : {}),
    profileUrl: `/user/@${data.user.username}?tab=collection&filter=trades`,
  };
}

export const collectionRepository = {
  collection(userId: string) {
    return getFirebaseAdminFirestore()
      .collection(FIRESTORE_COLLECTIONS.users)
      .doc(userId)
      .collection("collection");
  },

  entry(userId: string, cardId: string) {
    return this.collection(userId).doc(cardId);
  },

  stats(userId: string) {
    return getFirebaseAdminFirestore()
      .collection(FIRESTORE_COLLECTIONS.users)
      .doc(userId)
      .collection("stats")
      .doc("collection");
  },

  trade(cardId: string, userId: string) {
    return getFirebaseAdminFirestore()
      .collection(FIRESTORE_COLLECTIONS.cardTrades)
      .doc(`${cardId}__${userId}`);
  },

  async getEntry(userId: string, cardId: string) {
    return entryFromSnapshot(await this.entry(userId, cardId).get());
  },

  async getEntriesForCards(userId: string, cardIds: string[]) {
    const uniqueIds = [...new Set(cardIds)];
    if (!uniqueIds.length) return new Map<string, CollectionEntryState>();
    const snapshots = await getFirebaseAdminFirestore().getAll(
      ...uniqueIds.map((cardId) => this.entry(userId, cardId)),
    );
    return new Map(
      snapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => [snapshot.id, entryFromSnapshot(snapshot)]),
    );
  },

  async getAllEntries(userId: string) {
    const snapshot = await this.collection(userId).get();
    return snapshot.docs.map(entryFromSnapshot);
  },

  async getTradeSettings(userId: string) {
    const snapshot = await getFirebaseAdminFirestore()
      .collection(FIRESTORE_COLLECTIONS.users)
      .doc(userId)
      .get();
    return tradeSettingsFromData(snapshot.get("tradeSettings"));
  },

  async getCardTraders(
    cardId: string,
    { limit = 5, cursor }: { limit?: number; cursor?: string } = {},
  ): Promise<CardTraderPage> {
    const firestore = getFirebaseAdminFirestore();
    const collection = firestore.collection(FIRESTORE_COLLECTIONS.cardTrades);
    const decoded = decodeCursor(cursor);
    let query = collection
      .where("cardId", "==", cardId)
      .orderBy("updatedAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (decoded) {
      query = query.startAfter(
        Timestamp.fromMillis(decoded.updatedAtMillis),
        decoded.id,
      );
    }
    const countPromise = collection.where("cardId", "==", cardId).count().get();
    let pageDocuments: QueryDocumentSnapshot[];
    try {
      pageDocuments = (await query.limit(limit + 1).get()).docs;
    } catch (error) {
      if (!isUnavailableIndex(error)) throw error;
      if (!didWarnAboutTradeIndex) {
        didWarnAboutTradeIndex = true;
        console.warn(
          "[Collection] The cardTrades composite index is not ready; using the temporary in-memory pagination fallback.",
        );
      }
      const fallback = await collection
        .where("cardId", "==", cardId)
        .limit(INDEX_BUILD_FALLBACK_LIMIT)
        .get();
      pageDocuments = fallback.docs
        .sort(sortTradeDocuments)
        .filter((document) => !decoded || isAfterTradeCursor(document, decoded))
        .slice(0, limit + 1);
    }
    const countSnapshot = await countPromise;
    const hasMore = pageDocuments.length > limit;
    const documents = pageDocuments.slice(0, limit);
    const items = documents.flatMap((document) => {
      const trader = traderFromSnapshot(document);
      return trader ? [trader] : [];
    });
    const last = documents.at(-1);
    const updatedAt = last?.get("updatedAt");
    const nextCursor = hasMore && last && updatedAt instanceof Timestamp
      ? encodeCursor({ updatedAtMillis: updatedAt.toMillis(), id: last.id })
      : undefined;
    return {
      items,
      total: countSnapshot.data().count,
      ...(nextCursor ? { nextCursor } : {}),
    };
  },

  async getPublicTradesForUser(userId: string, limit?: number) {
    let query = getFirebaseAdminFirestore()
      .collection(FIRESTORE_COLLECTIONS.cardTrades)
      .where("userId", "==", userId);
    if (limit) query = query.limit(limit);
    const snapshot = await query.get();
    return snapshot.docs.map((document) => ({
      reference: document.ref,
      data: document.data() as PublicCardTradeDocument,
    }));
  },
};

export { DEFAULT_TRADE_SETTINGS, entryFromSnapshot, tradeSettingsFromData };
