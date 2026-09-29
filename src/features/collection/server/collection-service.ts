import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { isCollectibleCard } from "@/features/cards/collectibility";
import {
  getCollectibleCardCount,
  getCollectionCatalog,
  getCodexFilterOptions,
} from "@/features/cards/server/codex-service";
import {
  calculateCollectionStats,
  collectionEntryState,
  emptyCollectionEntry,
  isValidTradeQuantity,
  MAX_OWNED_QUANTITY,
  publicTradeDiscord,
} from "@/features/collection/domain";
import {
  collectionRepository,
  entryFromSnapshot,
  tradeSettingsFromData,
} from "@/features/collection/repositories/collection-repository";
import type {
  CardTraderPage,
  CollectionEntryState,
  CollectionPageData,
  PublicCardTradeDocument,
  TradePrivacySettings,
  UserCollectionStats,
} from "@/features/collection/types";
import { recordCollectionUpdatedActivity } from "@/features/community/server/activity-service";
import type { PublicUserProfileDocument } from "@/features/community/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { firestoreDateIso } from "@/lib/firebase/timestamp";
import type { AppLocale } from "@/lib/i18n/locales";
import type { Card } from "@/types/card";

export class CollectionServiceError extends Error {
  constructor(
    public readonly code:
      | "CARD_NOT_FOUND"
      | "CARD_NOT_COLLECTIBLE"
      | "TRADE_EXCEEDS_DUPLICATES",
  ) {
    super(code);
  }
}

type Mutation =
  | { kind: "set-owned"; quantity: number }
  | { kind: "adjust-owned"; delta: -1 | 1 }
  | { kind: "set-trade"; quantity: number }
  | { kind: "adjust-trade"; delta: -1 | 1 };

function storedStats(
  data: FirebaseFirestore.DocumentData | undefined,
  totalCollectibleCards: number,
): UserCollectionStats | null {
  if (!data) return null;
  const uniqueOwnedCards = Number(data.uniqueOwnedCards ?? 0);
  return {
    uniqueOwnedCards,
    totalOwnedCopies: Number(data.totalOwnedCopies ?? 0),
    duplicateCopies: Number(data.duplicateCopies ?? 0),
    tradeCopies: Number(data.tradeCopies ?? 0),
    tradeUniqueCards: Number(data.tradeUniqueCards ?? 0),
    totalCollectibleCards,
    completionPercentage: totalCollectibleCards > 0
      ? (uniqueOwnedCards / totalCollectibleCards) * 100
      : 0,
    updatedAtIso: data.updatedAt ? firestoreDateIso(data.updatedAt) : null,
  };
}

function publicTradeData(
  cardId: string,
  userId: string,
  quantity: number,
  profile: PublicUserProfileDocument,
  settings: TradePrivacySettings,
  updatedAt: Timestamp,
): PublicCardTradeDocument {
  return {
    cardId,
    userId,
    tradeQuantity: quantity,
    user: {
      username: profile.username,
      displayName: profile.displayName,
      ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    },
    ...(publicTradeDiscord(settings)
      ? { discord: publicTradeDiscord(settings) }
      : {}),
    updatedAt,
  };
}

function publicTradesAllowed(
  settings: TradePrivacySettings,
  profile: PublicUserProfileDocument | null,
) {
  return Boolean(settings.showTradesPublicly && profile?.visibility.publicProfile);
}

export async function getCollectionEntriesForCards(
  userId: string,
  cardIds: string[],
) {
  return collectionRepository.getEntriesForCards(userId, cardIds);
}

export async function getCollectionEntry(userId: string, cardId: string) {
  return collectionRepository.getEntry(userId, cardId);
}

export async function getTradePrivacySettings(userId: string) {
  return collectionRepository.getTradeSettings(userId);
}

export async function getCollectionStats(userId: string) {
  const totalCollectibleCards = await getCollectibleCardCount();
  const snapshot = await collectionRepository.stats(userId).get();
  const persisted = storedStats(snapshot.data(), totalCollectibleCards);
  if (persisted) return persisted;
  return calculateCollectionStats(
    await collectionRepository.getAllEntries(userId),
    totalCollectibleCards,
  );
}

export async function getCollectionPageData(
  userId: string,
  locale: AppLocale,
): Promise<CollectionPageData> {
  const [catalog, options, entries, stats] = await Promise.all([
    getCollectionCatalog(locale),
    getCodexFilterOptions(locale),
    collectionRepository.getAllEntries(userId),
    getCollectionStats(userId),
  ]);
  const byCardId = new Map(entries.map((entry) => [entry.cardId, entry]));
  return {
    items: catalog.map((card) => ({
      card,
      ...(byCardId.get(card.id) ?? emptyCollectionEntry(card.id)),
    })),
    options,
    stats,
  };
}

export function getCardTraders(
  cardId: string,
  options?: { limit?: number; cursor?: string },
): Promise<CardTraderPage> {
  return collectionRepository.getCardTraders(cardId, options);
}

async function baseStatsInTransaction(
  transaction: FirebaseFirestore.Transaction,
  userId: string,
  statsSnapshot: FirebaseFirestore.DocumentSnapshot,
  totalCollectibleCards: number,
) {
  const persisted = storedStats(statsSnapshot.data(), totalCollectibleCards);
  if (persisted) return persisted;
  const collectionSnapshot = await transaction.get(
    collectionRepository.collection(userId),
  );
  return calculateCollectionStats(
    collectionSnapshot.docs.map(entryFromSnapshot),
    totalCollectibleCards,
  );
}

export async function mutateCollectionEntry(
  userId: string,
  cardId: string,
  mutation: Mutation,
) {
  const firestore = getFirebaseAdminFirestore();
  const totalCollectibleCards = await getCollectibleCardCount();
  const entryRef = collectionRepository.entry(userId, cardId);
  const statsRef = collectionRepository.stats(userId);
  const tradeRef = collectionRepository.trade(cardId, userId);
  const cardRef = firestore.collection(FIRESTORE_COLLECTIONS.cards).doc(cardId);
  const userRef = firestore.collection(FIRESTORE_COLLECTIONS.users).doc(userId);
  const profileRef = firestore
    .collection(FIRESTORE_COLLECTIONS.publicProfiles)
    .doc(userId);

  const result = await firestore.runTransaction(async (transaction) => {
    const [cardSnapshot, entrySnapshot, statsSnapshot, userSnapshot, profileSnapshot] =
      await Promise.all([
        transaction.get(cardRef),
        transaction.get(entryRef),
        transaction.get(statsRef),
        transaction.get(userRef),
        transaction.get(profileRef),
      ]);
    if (!cardSnapshot.exists) throw new CollectionServiceError("CARD_NOT_FOUND");
    const card = { id: cardSnapshot.id, ...cardSnapshot.data() } as Card;
    if (!isCollectibleCard(card)) {
      throw new CollectionServiceError("CARD_NOT_COLLECTIBLE");
    }

    const previous = entryFromSnapshot(entrySnapshot);
    let next: CollectionEntryState;
    if (mutation.kind === "set-owned") {
      next = collectionEntryState(cardId, mutation.quantity, previous.tradeQuantity);
    } else if (mutation.kind === "adjust-owned") {
      next = collectionEntryState(
        cardId,
        Math.min(
          MAX_OWNED_QUANTITY,
          Math.max(0, previous.ownedQuantity + mutation.delta),
        ),
        previous.tradeQuantity,
      );
    } else {
      const requested = mutation.kind === "set-trade"
        ? mutation.quantity
        : previous.tradeQuantity + mutation.delta;
      if (!isValidTradeQuantity(previous.ownedQuantity, requested)) {
        throw new CollectionServiceError("TRADE_EXCEEDS_DUPLICATES");
      }
      next = collectionEntryState(cardId, previous.ownedQuantity, requested);
    }

    const baseline = await baseStatsInTransaction(
      transaction,
      userId,
      statsSnapshot,
      totalCollectibleCards,
    );
    const uniqueDelta = Number(next.ownedQuantity > 0) - Number(previous.ownedQuantity > 0);
    const tradeUniqueDelta = Number(next.tradeQuantity > 0) - Number(previous.tradeQuantity > 0);
    const now = Timestamp.now();
    const stats: UserCollectionStats = {
      uniqueOwnedCards: Math.max(0, baseline.uniqueOwnedCards + uniqueDelta),
      totalOwnedCopies: Math.max(
        0,
        baseline.totalOwnedCopies + next.ownedQuantity - previous.ownedQuantity,
      ),
      duplicateCopies: Math.max(
        0,
        baseline.duplicateCopies + next.duplicateQuantity - previous.duplicateQuantity,
      ),
      tradeCopies: Math.max(
        0,
        baseline.tradeCopies + next.tradeQuantity - previous.tradeQuantity,
      ),
      tradeUniqueCards: Math.max(0, baseline.tradeUniqueCards + tradeUniqueDelta),
      totalCollectibleCards,
      completionPercentage: 0,
      updatedAtIso: now.toDate().toISOString(),
    };
    stats.completionPercentage = totalCollectibleCards > 0
      ? (stats.uniqueOwnedCards / totalCollectibleCards) * 100
      : 0;

    if (next.ownedQuantity === 0) {
      transaction.delete(entryRef);
    } else {
      transaction.set(entryRef, {
        cardId,
        ownedQuantity: next.ownedQuantity,
        tradeQuantity: next.tradeQuantity,
        addedAt: entrySnapshot.get("addedAt") ?? entrySnapshot.get("createdAt") ?? now,
        updatedAt: now,
      });
    }
    transaction.set(statsRef, {
      uniqueOwnedCards: stats.uniqueOwnedCards,
      totalOwnedCopies: stats.totalOwnedCopies,
      duplicateCopies: stats.duplicateCopies,
      tradeCopies: stats.tradeCopies,
      tradeUniqueCards: stats.tradeUniqueCards,
      totalCollectibleCards,
      completionPercentage: stats.completionPercentage,
      updatedAt: now,
    });

    const profile = profileSnapshot.exists
      ? ({ id: profileSnapshot.id, ...profileSnapshot.data() } as PublicUserProfileDocument)
      : null;
    const settings = tradeSettingsFromData(userSnapshot.get("tradeSettings"));
    if (next.tradeQuantity > 0 && profile && publicTradesAllowed(settings, profile)) {
      transaction.set(
        tradeRef,
        publicTradeData(cardId, userId, next.tradeQuantity, profile, settings, now),
      );
    } else {
      transaction.delete(tradeRef);
    }
    if (profile) {
      transaction.update(profileRef, {
        "stats.collectionCardsCount": FieldValue.increment(uniqueDelta),
        "stats.collectionCompletionPercentage": stats.completionPercentage,
        "stats.tradeCardsCount": FieldValue.increment(tradeUniqueDelta),
        updatedAt: now,
      });
    }

    return { previous, next, stats, card };
  });

  if (result.previous.ownedQuantity === 0 && result.next.ownedQuantity > 0) {
    await recordCollectionUpdatedActivity(userId, {
      addedCount: 1,
      cards: [{
        cardId: result.card.id,
        slug: result.card.slug,
        translations: result.card.translations,
        ...(result.card.artwork.url ? { artworkUrl: result.card.artwork.url } : {}),
      }],
    }).catch((error) => {
      console.error("[Collection] Unable to publish the collection activity.", error);
    });
  }
  return { entry: result.next, stats: result.stats };
}

async function commitOperations(
  operations: Array<(batch: FirebaseFirestore.WriteBatch) => void>,
) {
  const firestore = getFirebaseAdminFirestore();
  for (let index = 0; index < operations.length; index += 400) {
    const batch = firestore.batch();
    operations.slice(index, index + 400).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

export async function purgeUserTradeReadModels(userId: string) {
  const existingTrades = await collectionRepository.getPublicTradesForUser(userId);
  await commitOperations(
    existingTrades.map(({ reference }) => (batch) => batch.delete(reference)),
  );
}

export async function syncUserTradeReadModels(
  userId: string,
  settingsOverride?: TradePrivacySettings,
) {
  const firestore = getFirebaseAdminFirestore();
  const [settings, profileSnapshot, entries, existingTrades] = await Promise.all([
    settingsOverride
      ? Promise.resolve(settingsOverride)
      : collectionRepository.getTradeSettings(userId),
    firestore.collection(FIRESTORE_COLLECTIONS.publicProfiles).doc(userId).get(),
    collectionRepository.getAllEntries(userId),
    collectionRepository.getPublicTradesForUser(userId),
  ]);
  const profile = profileSnapshot.exists
    ? ({ id: profileSnapshot.id, ...profileSnapshot.data() } as PublicUserProfileDocument)
    : null;
  const existingByCardId = new Map(
    existingTrades.map((trade) => [trade.data.cardId, trade.reference]),
  );
  const now = Timestamp.now();
  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  const shouldPublish = profile && publicTradesAllowed(settings, profile);

  if (shouldPublish && profile) {
    for (const entry of entries.filter((item) => item.tradeQuantity > 0)) {
      const reference = collectionRepository.trade(entry.cardId, userId);
      operations.push((batch) => batch.set(
        reference,
        publicTradeData(
          entry.cardId,
          userId,
          entry.tradeQuantity,
          profile,
          settings,
          now,
        ),
      ));
      existingByCardId.delete(entry.cardId);
    }
  }
  for (const reference of existingByCardId.values()) {
    operations.push((batch) => batch.delete(reference));
  }
  await commitOperations(operations);
}

export async function updateTradePrivacySettings(
  userId: string,
  settings: TradePrivacySettings,
) {
  const current = await collectionRepository.getTradeSettings(userId);
  const normalized = {
    ...settings,
    showDiscordForTrades:
      settings.showTradesPublicly && settings.showDiscordForTrades,
  };
  const saveSettings = () => getFirebaseAdminFirestore()
    .collection(FIRESTORE_COLLECTIONS.users)
    .doc(userId)
    .set(
      { tradeSettings: normalized, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  const expandsPublicData =
    (!current.showTradesPublicly && normalized.showTradesPublicly) ||
    (!current.showDiscordForTrades && normalized.showDiscordForTrades);
  if (expandsPublicData) {
    // Persist consent before exposing any new public data.
    await saveSettings();
    await syncUserTradeReadModels(userId, normalized);
  } else {
    // Remove or rewrite public snapshots before recording stricter privacy.
    await syncUserTradeReadModels(userId, normalized);
    await saveSettings();
  }
  return normalized;
}

export function syncPublicTradeProfileSnapshot(userId: string) {
  return syncUserTradeReadModels(userId);
}
