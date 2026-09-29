import type {
  CollectionEntryState,
  TradePrivacySettings,
  UserCollectionStats,
} from "@/features/collection/types";

export const MAX_OWNED_QUANTITY = 999;

export function duplicateQuantity(ownedQuantity: number) {
  return Math.max(Math.trunc(ownedQuantity) - 1, 0);
}

export function isValidTradeQuantity(ownedQuantity: number, tradeQuantity: number) {
  return Number.isInteger(tradeQuantity) &&
    tradeQuantity >= 0 &&
    tradeQuantity <= duplicateQuantity(ownedQuantity);
}

export function publicTradeDiscord(settings: TradePrivacySettings) {
  return settings.showTradesPublicly && settings.showDiscordForTrades && settings.discord
    ? settings.discord
    : undefined;
}

export function collectionEntryState(
  cardId: string,
  ownedQuantity: number,
  tradeQuantity: number,
): CollectionEntryState {
  const owned = Math.min(
    MAX_OWNED_QUANTITY,
    Math.max(0, Math.trunc(ownedQuantity)),
  );
  const trade = Math.min(
    duplicateQuantity(owned),
    Math.max(0, Math.trunc(tradeQuantity)),
  );
  return {
    cardId,
    ownedQuantity: owned,
    duplicateQuantity: duplicateQuantity(owned),
    tradeQuantity: trade,
  };
}

export function emptyCollectionEntry(cardId: string) {
  return collectionEntryState(cardId, 0, 0);
}

export function calculateCollectionStats(
  entries: CollectionEntryState[],
  totalCollectibleCards: number,
  updatedAtIso: string | null = null,
): UserCollectionStats {
  const uniqueOwnedCards = entries.filter(
    (entry) => entry.ownedQuantity > 0,
  ).length;
  const totalOwnedCopies = entries.reduce(
    (total, entry) => total + entry.ownedQuantity,
    0,
  );
  const duplicateCopies = entries.reduce(
    (total, entry) => total + entry.duplicateQuantity,
    0,
  );
  const tradeCopies = entries.reduce(
    (total, entry) => total + entry.tradeQuantity,
    0,
  );
  const tradeUniqueCards = entries.filter(
    (entry) => entry.tradeQuantity > 0,
  ).length;
  return {
    uniqueOwnedCards,
    totalOwnedCopies,
    duplicateCopies,
    tradeCopies,
    tradeUniqueCards,
    totalCollectibleCards,
    completionPercentage: totalCollectibleCards > 0
      ? (uniqueOwnedCards / totalCollectibleCards) * 100
      : 0,
    updatedAtIso,
  };
}
