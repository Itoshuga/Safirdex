import type { Card } from "@/types/card";

export const CARD_PAGE_SIZE = 25;

export type CardSort = "number" | "newest" | "oldest";
export type CardCursorDirection = "after" | "before";

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
  cursorDirection?: CardCursorDirection;
  limit: number;
}

export interface CardsRepositoryPage {
  items: Card[];
  nextCursor: string | null;
  previousCursor: string | null;
}
