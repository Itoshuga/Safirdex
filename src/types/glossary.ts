import type { FirestoreEntity } from "@/types/firestore";
import type { Translations } from "@/types/translation";

export interface GlossaryTranslation {
  label: string;
  definition: string;
}

export interface GlossaryEntry extends FirestoreEntity {
  key: string;
  slug: string;
  translations: Translations<GlossaryTranslation>;
}

export type CreateGlossaryEntryInput = Omit<
  GlossaryEntry,
  keyof FirestoreEntity
>;

export type UpdateGlossaryEntryInput = Partial<CreateGlossaryEntryInput>;
