import "server-only";

import { cardsRepository } from "@/repositories/cards.repository";

export async function getCards() {
  return cardsRepository.getAll();
}

export async function getFeaturedCards(limit = 4) {
  return cardsRepository.getFeatured(limit);
}

export async function getCardBySlug(slug: string) {
  return cardsRepository.getBySlug(slug);
}
