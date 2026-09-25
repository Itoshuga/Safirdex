import type { TranslationMap } from "@/types/i18n";

export type ArtworkOrientation = "vertical" | "horizontal";

export interface Artwork {
  id?: string;
  url: string;
  orientation: ArtworkOrientation;
  alt: TranslationMap<string>;
}

export interface CardTranslation {
  name: string;
  description: string;
}

export interface Card {
  id: string;
  number: number;
  seasonId: string;
  editionId?: string;
  rarityId: string;
  typeIds: string[];
  attack: number;
  value: number;
  defense: number;
  isCommander: boolean;
  isPromo: boolean;
  artwork: Artwork;
  alternativeArtworks?: Artwork[];
  translations: TranslationMap<CardTranslation>;
}

export interface CardPreviewData extends Card {
  rarity: TranslationMap<string>;
  types: TranslationMap<string[]>;
}
