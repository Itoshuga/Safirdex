import type { FirestoreEntity } from "@/types/firestore";
import type {
  NameDescriptionTranslation,
  Translations,
} from "@/types/translation";

export interface RarityVisual {
  color?: string;
  iconStoragePath?: string;
  iconUrl?: string;
}

export interface Rarity extends FirestoreEntity {
  slug: string;
  translations: Translations<NameDescriptionTranslation>;
  order: number;
  visual?: RarityVisual;
}

export type CreateRarityInput = Omit<Rarity, keyof FirestoreEntity>;

export type UpdateRarityInput = Partial<CreateRarityInput>;
