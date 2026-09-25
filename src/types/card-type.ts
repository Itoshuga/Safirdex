import type { FirestoreEntity } from "@/types/firestore";
import type {
  NameDescriptionTranslation,
  Translations,
} from "@/types/translation";

export interface CardTypeVisual {
  color?: string;
  iconStoragePath?: string;
}

export interface CardType extends FirestoreEntity {
  slug: string;
  translations: Translations<NameDescriptionTranslation>;
  visual?: CardTypeVisual;
}

export type CreateCardTypeInput = Omit<CardType, keyof FirestoreEntity>;

export type UpdateCardTypeInput = Partial<CreateCardTypeInput>;
