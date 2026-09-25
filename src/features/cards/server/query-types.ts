import type { Card } from "@/types/card";

export const CARD_PAGE_SIZE = 24;

export type CardSort = "number" | "newest" | "oldest";

export interface CardQueryFilters {
  seasonId?: string;
  setId?: string;
  rarityId?: string;
  typeId?: string;
  isCommander?: boolean;
  isPromo?: boolean;
}

export interface CardsPageQuery {
  filters: CardQueryFilters;
  sort: CardSort;
  cursor?: string;
  limit: number;
}

export interface CardsRepositoryPage {
  items: Card[];
  nextCursor: string | null;
  hasMore: boolean;
}
