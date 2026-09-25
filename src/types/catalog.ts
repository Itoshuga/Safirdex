import type { Artwork } from "@/types/card";
import type { TranslationMap } from "@/types/i18n";

export interface TaxonomyTranslation {
  name: string;
  description?: string;
}

export interface Season {
  id: string;
  slug: string;
  cardCount?: number;
  translations: TranslationMap<TaxonomyTranslation>;
  artwork?: Artwork;
}

export interface Edition {
  id: string;
  seasonId: string;
  slug: string;
  translations: TranslationMap<TaxonomyTranslation>;
}

export interface Rarity {
  id: string;
  sortOrder: number;
  translations: TranslationMap<TaxonomyTranslation>;
}

export interface CardType {
  id: string;
  translations: TranslationMap<TaxonomyTranslation>;
}

export interface GlossaryEntry {
  id: string;
  key: string;
  translations: TranslationMap<{
    term: string;
    definition: string;
  }>;
}
