import type { CardOrientation } from "@/types/artwork";
import type {
  RequiredNameDescriptionTranslation,
  Translations,
} from "@/types/translation";

export interface CardPreviewData {
  id: string;
  number: number;
  seasonId: string;
  rarityId: string;
  typeIds: string[];
  attack: number;
  value: number;
  defense: number;
  isCommander: boolean;
  isPromo: boolean;
  artwork: {
    url: string;
    orientation: CardOrientation;
    alt: Translations<string>;
  };
  translations: Translations<RequiredNameDescriptionTranslation>;
  rarity: Translations<string>;
  types: Translations<string[]>;
}
