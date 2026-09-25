import type { CardArtwork } from "@/types/artwork";
import type { FirestoreEntity } from "@/types/firestore";
import type {
  RequiredNameDescriptionTranslation,
  Translations,
} from "@/types/translation";

export interface Card extends FirestoreEntity {
  number: number;
  slug: string;
  seasonId: string;
  setId: string | null;
  rarityId: string;
  typeIds: string[];
  attack: number;
  value: number;
  defense: number;
  isCommander: boolean;
  isPromo: boolean;
  isFeatured: boolean;
  translations: Translations<RequiredNameDescriptionTranslation>;
  artwork: CardArtwork;
  alternativeArtworks: CardArtwork[];
}

export type CreateCardInput = Omit<Card, keyof FirestoreEntity>;

export type UpdateCardInput = Partial<CreateCardInput>;
