import type { Timestamp } from "firebase-admin/firestore";

import type { CardListItem, CodexFilterOptions } from "@/features/cards/types";

export interface UserCollectionEntryDocument {
  cardId: string;
  ownedQuantity: number;
  tradeQuantity: number;
  addedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CollectionEntryState {
  cardId: string;
  ownedQuantity: number;
  duplicateQuantity: number;
  tradeQuantity: number;
}

export interface UserCollectionStats {
  uniqueOwnedCards: number;
  totalOwnedCopies: number;
  duplicateCopies: number;
  tradeCopies: number;
  tradeUniqueCards: number;
  totalCollectibleCards: number;
  completionPercentage: number;
  updatedAtIso: string | null;
}

export interface CollectionCardView extends CollectionEntryState {
  card: CardListItem;
}

export interface CollectionPageData {
  items: CollectionCardView[];
  options: CodexFilterOptions;
  stats: UserCollectionStats;
}

export interface TradePrivacySettings {
  showTradesPublicly: boolean;
  showDiscordForTrades: boolean;
  discord: string;
}

export interface PublicCardTradeDocument {
  cardId: string;
  userId: string;
  tradeQuantity: number;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  discord?: string;
  updatedAt: Timestamp;
}

export interface CardTraderView {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tradeQuantity: number;
  discord?: string;
  profileUrl: string;
}

export interface CardTraderPage {
  items: CardTraderView[];
  total: number;
  nextCursor?: string;
}

export type CollectionActionCode =
  | "AUTH_REQUIRED"
  | "APPLICATION_MAINTENANCE"
  | "INVALID_COLLECTION_INPUT"
  | "CARD_NOT_FOUND"
  | "CARD_NOT_COLLECTIBLE"
  | "TRADE_EXCEEDS_DUPLICATES"
  | "COLLECTION_UPDATE_FAILED";

export type CollectionActionResult =
  | {
      ok: true;
      entry: CollectionEntryState;
      stats: UserCollectionStats;
    }
  | { ok: false; code: CollectionActionCode };
