import type { Translations } from "@/types/translation";

export type CardOrientation = "vertical" | "horizontal";

export interface ArtworkTranslation {
  name?: string;
  alt?: string;
}

export interface CardArtwork {
  id: string;
  storagePath: string;
  url?: string;
  orientation: CardOrientation;
  isPrimary?: boolean;
  translations?: Translations<ArtworkTranslation>;
}
