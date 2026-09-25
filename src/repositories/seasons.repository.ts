import "server-only";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { seasonConverter } from "@/lib/firebase/converters/entities";
import { createFirestoreRepository } from "@/repositories/base.repository";
import type {
  CreateSeasonInput,
  Season,
  UpdateSeasonInput,
} from "@/types/season";
import {
  createSeasonSchema,
  updateSeasonSchema,
} from "@/validation/schemas";

const repository = createFirestoreRepository<
  Season,
  CreateSeasonInput,
  UpdateSeasonInput
>({
  collectionName: FIRESTORE_COLLECTIONS.seasons,
  entityName: "season",
  converter: seasonConverter,
  createSchema: createSeasonSchema,
  updateSchema: updateSeasonSchema,
});

export const seasonsRepository = {
  ...repository,
  getAll: () => repository.getAll({ orderBy: "number" }),
  getBySlug: (slug: string) =>
    repository.findOne({
      filters: [{ field: "slug", operator: "==", value: slug }],
    }),
  getFeatured: () =>
    repository.findOne({
      filters: [{ field: "isFeatured", operator: "==", value: true }],
    }),
};
