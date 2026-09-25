import type { CardOrientation } from "@/types/artwork";

export interface CodexEntityItem {
  id: string;
  slug: string;
  name: string;
}

export interface CodexVisualEntityItem extends CodexEntityItem {
  color?: string;
  iconUrl?: string;
}

export interface CardListItem {
  id: string;
  number: number;
  slug: string;
  name: string;
  attack: number;
  value: number;
  defense: number;
  isCommander: boolean;
  isPromo: boolean;
  artwork: {
    url?: string;
    orientation: CardOrientation;
    alt: string;
  };
  season: CodexEntityItem | null;
  set: CodexEntityItem | null;
  rarity: (CodexVisualEntityItem & { order: number }) | null;
  types: CodexVisualEntityItem[];
  owned?: boolean;
  quantity?: number;
  /** Stable IDs used by the server-side page filter fallback. */
  relationIds: {
    seasonId: string;
    setId: string | null;
    rarityId: string;
    typeIds: string[];
  };
}

export interface CardDetailItem extends CardListItem {
  description: string;
  alternativeArtworks: Array<{
    id: string;
    url?: string;
    orientation: CardOrientation;
    name: string;
    alt: string;
  }>;
  glossary: Record<
    string,
    {
      label: string;
      definition: string;
    }
  >;
}

export interface CodexFilterOption extends CodexEntityItem {
  seasonId?: string;
}

export interface CodexFilterOptions {
  seasons: CodexFilterOption[];
  sets: CodexFilterOption[];
  rarities: Array<CodexFilterOption & { color?: string }>;
  types: Array<CodexFilterOption & { color?: string }>;
}

export interface CodexQueryState {
  q: string;
  season?: string;
  set?: string;
  rarity?: string;
  type?: string;
  commander?: boolean;
  promo?: boolean;
  sort: "number" | "newest" | "oldest";
  view: "grid" | "list";
  cursor?: string;
}

export interface CodexPageData {
  items: CardListItem[];
  options: CodexFilterOptions;
  query: CodexQueryState;
  nextCursor: string | null;
  hasMore: boolean;
  fetchedCount: number;
}
