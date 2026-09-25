import "server-only";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { cardSetConverter } from "@/lib/firebase/converters/entities";
import { createFirestoreRepository } from "@/repositories/base.repository";
import type {
  CardSet,
  CreateCardSetInput,
  UpdateCardSetInput,
} from "@/types/card-set";
import {
  createCardSetSchema,
  updateCardSetSchema,
} from "@/validation/schemas";

const repository = createFirestoreRepository<
  CardSet,
  CreateCardSetInput,
  UpdateCardSetInput
>({
  collectionName: FIRESTORE_COLLECTIONS.sets,
  entityName: "set",
  converter: cardSetConverter,
  createSchema: createCardSetSchema,
  updateSchema: updateCardSetSchema,
});

export const setsRepository = {
  ...repository,
  getAll: () => repository.getAll({ orderBy: "createdAt" }),
  getBySlug: (slug: string) =>
    repository.findOne({
      filters: [{ field: "slug", operator: "==", value: slug }],
    }),
  getBySeason: (seasonId: string) =>
    repository.findMany({
      filters: [{ field: "seasonId", operator: "==", value: seasonId }],
      orderBy: "releaseDate",
    }),
};
