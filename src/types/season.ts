import type { Timestamp } from "firebase-admin/firestore";

import type { FirestoreEntity, StoredAsset } from "@/types/firestore";
import type {
  NameDescriptionTranslation,
  Translations,
} from "@/types/translation";

export interface Season extends FirestoreEntity {
  slug: string;
  number: number;
  translations: Translations<NameDescriptionTranslation>;
  artwork?: StoredAsset;
  releaseDate: Timestamp | null;
  isActive: boolean;
  isFeatured: boolean;
}

export type CreateSeasonInput = Omit<Season, keyof FirestoreEntity>;

export type UpdateSeasonInput = Partial<CreateSeasonInput>;
