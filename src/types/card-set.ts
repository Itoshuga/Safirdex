import type { Timestamp } from "firebase-admin/firestore";

import type { FirestoreEntity } from "@/types/firestore";
import type {
  NameDescriptionTranslation,
  Translations,
} from "@/types/translation";

export interface CardSet extends FirestoreEntity {
  seasonId: string;
  slug: string;
  code?: string;
  translations: Translations<NameDescriptionTranslation>;
  releaseDate: Timestamp | null;
}

export type CreateCardSetInput = Omit<CardSet, keyof FirestoreEntity>;

export type UpdateCardSetInput = Partial<CreateCardSetInput>;
