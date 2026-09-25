import type { CardSet } from "@/types/card-set";
import type { CardType } from "@/types/card-type";
import type { Card } from "@/types/card";
import type { Rarity } from "@/types/rarity";
import type { Season } from "@/types/season";

export interface CardDetails {
  card: Card;
  season: Season;
  set?: CardSet;
  rarity: Rarity;
  types: CardType[];
}
