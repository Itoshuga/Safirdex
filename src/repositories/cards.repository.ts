import "server-only";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { cardConverter } from "@/lib/firebase/converters/entities";
import { createFirestoreRepository } from "@/repositories/base.repository";
import type { Card, CreateCardInput, UpdateCardInput } from "@/types/card";
import {
  createCardSchema,
  updateCardSchema,
} from "@/validation/schemas";

const repository = createFirestoreRepository<
  Card,
  CreateCardInput,
  UpdateCardInput
>({
  collectionName: FIRESTORE_COLLECTIONS.cards,
  entityName: "card",
  converter: cardConverter,
  createSchema: createCardSchema,
  updateSchema: updateCardSchema,
});

export const cardsRepository = {
  ...repository,
  getAll: () => repository.getAll({ orderBy: "createdAt", direction: "desc" }),
  getBySlug: (slug: string) =>
    repository.findOne({
      filters: [{ field: "slug", operator: "==", value: slug }],
    }),
  getBySeason: (seasonId: string) =>
    repository.findMany({
      filters: [{ field: "seasonId", operator: "==", value: seasonId }],
      orderBy: "number",
    }),
  getBySet: (setId: string) =>
    repository.findMany({
      filters: [{ field: "setId", operator: "==", value: setId }],
      orderBy: "number",
    }),
  getByRarity: (rarityId: string) =>
    repository.findMany({
      filters: [{ field: "rarityId", operator: "==", value: rarityId }],
    }),
  getByType: (typeId: string) =>
    repository.findMany({
      filters: [{ field: "typeIds", operator: "array-contains", value: typeId }],
    }),
  getFeatured: (limit = 4) =>
    repository.findMany({
      filters: [{ field: "isFeatured", operator: "==", value: true }],
      limit,
    }),
};
