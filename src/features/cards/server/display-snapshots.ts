import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { EntityNotFoundError } from "@/repositories/errors";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";
import type { CardDisplaySnapshot } from "@/types/card-display";
import type { Card, CreateCardInput } from "@/types/card";
import type { Translations } from "@/types/translation";

function snapshotVisual(visual?: { color?: string; iconUrl?: string }) {
  if (!visual?.color && !visual?.iconUrl) return undefined;
  return {
    ...(visual.color ? { color: visual.color } : {}),
    ...(visual.iconUrl ? { iconUrl: visual.iconUrl } : {}),
  };
}

function nameTranslations(
  translations: Translations<{ name: string }>,
): Translations<{ name: string }> {
  return Object.fromEntries(
    Object.entries(translations).map(([locale, translation]) => [
      locale,
      { name: translation.name },
    ]),
  );
}

export async function buildCardDisplaySnapshots(
  cards: Array<Pick<CreateCardInput, "seasonId" | "setId" | "rarityId" | "typeIds">>,
): Promise<CardDisplaySnapshot[]> {
  if (cards.length === 0) return [];

  const [seasons, sets, rarities, types] = await Promise.all([
    seasonsRepository.getManyByIds(cards.map((card) => card.seasonId)),
    setsRepository.getManyByIds(
      cards.flatMap((card) => (card.setId ? [card.setId] : [])),
    ),
    raritiesRepository.getManyByIds(cards.map((card) => card.rarityId)),
    cardTypesRepository.getManyByIds(cards.flatMap((card) => card.typeIds)),
  ]);

  const seasonById = new Map(seasons.map((entity) => [entity.id, entity]));
  const setById = new Map(sets.map((entity) => [entity.id, entity]));
  const rarityById = new Map(rarities.map((entity) => [entity.id, entity]));
  const typeById = new Map(types.map((entity) => [entity.id, entity]));

  return cards.map((card) => {
    const season = seasonById.get(card.seasonId);
    const set = card.setId ? setById.get(card.setId) : undefined;
    const rarity = rarityById.get(card.rarityId);

    if (!season) throw new EntityNotFoundError("season", card.seasonId);
    if (card.setId && !set) throw new EntityNotFoundError("set", card.setId);
    if (!rarity) throw new EntityNotFoundError("rarity", card.rarityId);

    const resolvedTypes = card.typeIds.map((typeId) => {
      const type = typeById.get(typeId);
      if (!type) throw new EntityNotFoundError("card type", typeId);
      return type;
    });

    const rarityVisual = snapshotVisual(rarity.visual);

    return {
      season: {
        id: season.id,
        slug: season.slug,
        translations: nameTranslations(season.translations),
      },
      ...(set
        ? {
            set: {
              id: set.id,
              slug: set.slug,
              translations: nameTranslations(set.translations),
            },
          }
        : {}),
      rarity: {
        id: rarity.id,
        slug: rarity.slug,
        order: rarity.order,
        translations: nameTranslations(rarity.translations),
        ...(rarityVisual ? { visual: rarityVisual } : {}),
      },
      types: resolvedTypes.map((type) => {
        const visual = snapshotVisual(type.visual);
        return {
          id: type.id,
          slug: type.slug,
          translations: nameTranslations(type.translations),
          ...(visual ? { visual } : {}),
        };
      }),
    };
  });
}

export async function buildCardDisplaySnapshot(
  card: Pick<CreateCardInput, "seasonId" | "setId" | "rarityId" | "typeIds">,
) {
  const [snapshot] = await buildCardDisplaySnapshots([card]);
  return snapshot;
}

async function writeSnapshots(cards: Card[]) {
  if (cards.length === 0) return 0;

  const snapshots = await buildCardDisplaySnapshots(cards);
  const firestore = getFirebaseAdminFirestore();
  const collection = firestore.collection(FIRESTORE_COLLECTIONS.cards);

  for (let offset = 0; offset < cards.length; offset += 450) {
    const batch = firestore.batch();
    const batchCards = cards.slice(offset, offset + 450);
    batchCards.forEach((card, index) => {
      batch.update(collection.doc(card.id), {
        display: snapshots[offset + index],
        displayUpdatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  return cards.length;
}

export async function syncSeasonSnapshots(seasonId: string) {
  return writeSnapshots(await cardsRepository.getBySeason(seasonId));
}

export async function syncSetSnapshots(setId: string) {
  return writeSnapshots(await cardsRepository.getBySet(setId));
}

export async function syncRaritySnapshots(rarityId: string) {
  return writeSnapshots(await cardsRepository.getByRarity(rarityId));
}

export async function syncCardTypeSnapshots(typeId: string) {
  return writeSnapshots(await cardsRepository.getByType(typeId));
}

export async function syncAllCardDisplaySnapshots() {
  return writeSnapshots(await cardsRepository.getAll());
}
