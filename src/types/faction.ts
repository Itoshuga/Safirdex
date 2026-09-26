import type { FirestoreEntity } from "@/types/firestore";
import type {
  NameDescriptionTranslation,
  Translations,
} from "@/types/translation";

export interface FactionVisual {
  color?: string;
  iconStoragePath?: string;
  iconUrl?: string;
}

export interface Faction extends FirestoreEntity {
  slug: string;
  visual?: FactionVisual;
  translations: Translations<NameDescriptionTranslation>;
}

export type CreateFactionInput = Omit<Faction, keyof FirestoreEntity>;

export type UpdateFactionInput = Partial<CreateFactionInput>;
