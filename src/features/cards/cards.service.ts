import "server-only";

import { cardsRepository } from "@/repositories/cards.repository";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { EntityNotFoundError } from "@/repositories/errors";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";
import type { CardDetails } from "@/types/card-details";

export async function getCards() {
  return cardsRepository.getAll();
}

export async function getFeaturedCards(limit = 4) {
  return cardsRepository.getFeatured(limit);
}

export async function getCardBySlug(slug: string) {
  return cardsRepository.getBySlug(slug);
}

export async function getCardDetailsBySlug(
  slug: string,
): Promise<CardDetails | null> {
  const card = await cardsRepository.getBySlug(slug);

  if (!card) {
    return null;
  }

  const [season, set, rarity, types] = await Promise.all([
    seasonsRepository.getById(card.seasonId),
    card.setId ? setsRepository.getById(card.setId) : Promise.resolve(null),
    raritiesRepository.getById(card.rarityId),
    Promise.all(card.typeIds.map((typeId) => cardTypesRepository.getById(typeId))),
  ]);

  if (!season) {
    throw new EntityNotFoundError("season", card.seasonId);
  }

  if (!rarity) {
    throw new EntityNotFoundError("rarity", card.rarityId);
  }

  const missingTypeIndex = types.findIndex((type) => type === null);

  if (missingTypeIndex >= 0) {
    throw new EntityNotFoundError("card type", card.typeIds[missingTypeIndex]);
  }

  return {
    card,
    season,
    set: set ?? undefined,
    rarity,
    types: types.filter((type) => type !== null),
  };
}
