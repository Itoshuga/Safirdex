import type { Translations } from "@/types/translation";

export interface DisplayNameTranslation {
  name: string;
}

export interface CardDisplayEntity {
  id: string;
  slug: string;
  translations: Translations<DisplayNameTranslation>;
}

export interface CardDisplayVisualEntity extends CardDisplayEntity {
  visual?: {
    color?: string;
    iconUrl?: string;
  };
}

export interface CardDisplayRarity extends CardDisplayVisualEntity {
  order: number;
}

export interface CardDisplaySnapshot {
  season: CardDisplayEntity;
  set?: CardDisplayEntity;
  rarity: CardDisplayRarity;
  types: CardDisplayVisualEntity[];
}
