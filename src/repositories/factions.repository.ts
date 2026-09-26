import "server-only";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { factionConverter } from "@/lib/firebase/converters/entities";
import { createFirestoreRepository } from "@/repositories/base.repository";
import type {
  CreateFactionInput,
  Faction,
  UpdateFactionInput,
} from "@/types/faction";
import {
  createFactionSchema,
  updateFactionSchema,
} from "@/validation/schemas";

const repository = createFirestoreRepository<
  Faction,
  CreateFactionInput,
  UpdateFactionInput
>({
  collectionName: FIRESTORE_COLLECTIONS.factions,
  entityName: "faction",
  converter: factionConverter,
  createSchema: createFactionSchema,
  updateSchema: updateFactionSchema,
});

export const factionsRepository = {
  ...repository,
  getAll: () => repository.getAll({ orderBy: "slug" }),
  getBySlug: (slug: string) =>
    repository.findOne({
      filters: [{ field: "slug", operator: "==", value: slug }],
    }),
};
