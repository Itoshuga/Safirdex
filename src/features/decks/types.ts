import type { Timestamp } from "firebase-admin/firestore";

import type { CardArtwork } from "@/types/artwork";
import type { GameplayCardKind } from "@/types/card";
import type { Translations } from "@/types/translation";

export type DeckVisibility = "private" | "unlisted" | "public";
export type DeckPublicationStatus = "draft" | "published";
export type DeckLegalityStatus = "legal" | "incomplete" | "invalid";
export type DeckSort = "recent" | "updated" | "name";

export type DeckRuleIssueCode =
  | "deck_below_minimum"
  | "deck_above_maximum"
  | "too_many_copies"
  | "commander_in_main_deck"
  | "invalid_commander"
  | "not_enough_compatible_combatants";

export interface DeckRuleCard {
  id: string;
  gameplayCardId: string;
  gameplayKind: GameplayCardKind;
  factionIds: string[];
  value: number;
}

export interface DeckRuleEntry {
  cardId: string;
  quantity: number;
  card: DeckRuleCard;
}

export interface DeckRuleInput {
  entries: DeckRuleEntry[];
  commander: DeckRuleCard | null;
}

export interface DeckRuleIssue {
  code: DeckRuleIssueCode;
  cardId?: string;
  actual?: number;
  expected?: number;
}

export interface DeckRuleResult {
  status: DeckLegalityStatus;
  isLegal: boolean;
  issues: DeckRuleIssue[];
  errors: DeckRuleIssue[];
  warnings: DeckRuleIssue[];
  cardCount: number;
  mainDeckCardCount: number;
  commanderCount: number;
  compatibleCombatantsCount: number;
  totalValue: number;
  kindCounts: Record<GameplayCardKind, number>;
  factionCounts: Record<string, number>;
  progress: {
    totalCards: { current: number; min: number; max: number };
    commanderFactionCombatants?: { current: number; required: number };
  };
}

export interface DeckCardSnapshot extends DeckRuleCard {
  slug: string;
  number: number;
  translations: Translations<{ name: string }>;
  artwork: CardArtwork;
}

export interface DeckEntryDocument {
  cardId: string;
  quantity: number;
  card: DeckCardSnapshot;
}

export interface DeckAuthorSnapshot {
  userId: string;
  username: string;
  usernameNormalized: string;
  displayName: string;
  avatarUrl?: string;
}

export interface DeckRulesetSnapshot {
  id: string;
  version: number;
}

export interface DeckFactionSnapshot {
  id: string;
  slug: string;
  translations: Translations<{ name: string }>;
  color?: string;
}

export interface DeckDocument {
  id: string;
  authorId: string;
  author: DeckAuthorSnapshot;
  name: string;
  nameNormalized: string;
  searchTokens: string[];
  slug: string;
  description: string;
  visibility: DeckVisibility;
  status: DeckPublicationStatus;
  entries: DeckEntryDocument[];
  commander: DeckCardSnapshot | null;
  hasCommander: boolean;
  factionIds: string[];
  factions: DeckFactionSnapshot[];
  ruleset: DeckRulesetSnapshot;
  legality: {
    status: DeckLegalityStatus;
    isLegal: boolean;
    issues: DeckRuleIssue[];
    errors: DeckRuleIssue[];
    warnings: DeckRuleIssue[];
    checkedRulesetId: string;
    checkedRulesetVersion: number;
    checkedAt: Timestamp;
  };
  stats: {
    cardCount: number;
    mainDeckCardCount: number;
    commanderCount: number;
    uniqueCardCount: number;
    compatibleCombatantsCount: number;
    totalValue: number;
    kindCounts: Record<GameplayCardKind, number>;
    factionCounts: Record<string, number>;
  };
  preview: {
    artworkUrl?: string;
    artworkOrientation: "vertical" | "horizontal";
    commanderName?: string;
    commanderTranslations?: Translations<{ name: string }>;
  };
  firstPublishedAt?: Timestamp;
  publishedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DeckPreviewView {
  id: string;
  name: string;
  description: string;
  author: Omit<DeckAuthorSnapshot, "userId" | "usernameNormalized">;
  visibility: DeckVisibility;
  status: DeckPublicationStatus;
  legalityStatus: DeckLegalityStatus;
  cardCount: number;
  uniqueCardCount: number;
  factionIds: string[];
  factions: Array<{ id: string; name: string; color?: string }>;
  commanderName?: string;
  artworkUrl?: string;
  artworkOrientation: "vertical" | "horizontal";
  updatedAtIso: string;
  publishedAtIso?: string;
}

export interface DeckDetailView extends DeckPreviewView {
  description: string;
  isOwner: boolean;
  entries: Array<{
    cardId: string;
    quantity: number;
    card: DeckCardSnapshot & { name: string };
  }>;
  commander: (DeckCardSnapshot & { name: string }) | null;
  issues: DeckRuleIssue[];
  ruleset: DeckRulesetSnapshot;
}

export interface DeckBuilderDraft {
  deckId?: string;
  name: string;
  description: string;
  visibility: DeckVisibility;
  commanderId: string | null;
  entries: Array<{ cardId: string; quantity: number }>;
}

export interface DeckCatalogCard extends DeckCardSnapshot {
  name: string;
  description?: string;
  attack?: number;
  defense?: number;
  season?: { id: string; name: string } | null;
  set?: { id: string; name: string } | null;
  rarity?: { id: string; name: string; color?: string } | null;
  types?: Array<{ id: string; name: string; color?: string }>;
  relationIds?: {
    seasonId: string;
    setId: string | null;
    rarityId: string;
    typeIds: string[];
  };
}

export type DeckCatalogSort = "number" | "name" | "attack" | "value" | "defense";
export type DeckMembershipFilter = "all" | "in" | "out";

export interface DeckCatalogFilters {
  search: string;
  factionIds: string[];
  typeIds: string[];
  rarityIds: string[];
  seasonId: string;
  setId: string;
  attackMin: number;
  attackMax: number;
  valueMin: number;
  valueMax: number;
  defenseMin: number;
  defenseMax: number;
  compatibleOnly: boolean;
  membership: DeckMembershipFilter;
  sort: DeckCatalogSort;
}

export interface DeckCatalogQuery {
  search?: string;
  factionIds?: string[];
  typeIds?: string[];
  rarityIds?: string[];
  seasonId?: string;
  setId?: string;
  attackMin?: number;
  attackMax?: number;
  valueMin?: number;
  valueMax?: number;
  defenseMin?: number;
  defenseMax?: number;
  sort?: DeckCatalogSort;
}
