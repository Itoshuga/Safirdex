import "server-only";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { rarityConverter } from "@/lib/firebase/converters/entities";
import { createFirestoreRepository } from "@/repositories/base.repository";
import type {
  CreateRarityInput,
  Rarity,
  UpdateRarityInput,
} from "@/types/rarity";
import {
  createRaritySchema,
  updateRaritySchema,
} from "@/validation/schemas";

const repository = createFirestoreRepository<
  Rarity,
  CreateRarityInput,
  UpdateRarityInput
>({
  collectionName: FIRESTORE_COLLECTIONS.rarities,
  entityName: "rarity",
  converter: rarityConverter,
  createSchema: createRaritySchema,
  updateSchema: updateRaritySchema,
});

export const raritiesRepository = {
  ...repository,
  getAll: () => repository.getAll({ orderBy: "order" }),
  getBySlug: (slug: string) =>
    repository.findOne({
      filters: [{ field: "slug", operator: "==", value: slug }],
    }),
};
