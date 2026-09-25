import "server-only";

import { createAdminConverter } from "@/lib/firebase/converters/base.converter";
import type { CardSet } from "@/types/card-set";
import type { CardType } from "@/types/card-type";
import type { Card } from "@/types/card";
import type { GlossaryEntry } from "@/types/glossary";
import type { Rarity } from "@/types/rarity";
import type { Season } from "@/types/season";
import {
  cardSchema,
  cardSetSchema,
  cardTypeSchema,
  glossaryEntrySchema,
  raritySchema,
  seasonSchema,
} from "@/validation/schemas";

export const cardConverter = createAdminConverter<Card>(cardSchema);
export const seasonConverter = createAdminConverter<Season>(seasonSchema);
export const cardSetConverter = createAdminConverter<CardSet>(cardSetSchema);
export const rarityConverter = createAdminConverter<Rarity>(raritySchema);
export const cardTypeConverter = createAdminConverter<CardType>(cardTypeSchema);
export const glossaryEntryConverter =
  createAdminConverter<GlossaryEntry>(glossaryEntrySchema);
