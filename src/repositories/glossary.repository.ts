import "server-only";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { glossaryEntryConverter } from "@/lib/firebase/converters/entities";
import { createFirestoreRepository } from "@/repositories/base.repository";
import type {
  CreateGlossaryEntryInput,
  GlossaryEntry,
  UpdateGlossaryEntryInput,
} from "@/types/glossary";
import {
  createGlossaryEntrySchema,
  updateGlossaryEntrySchema,
} from "@/validation/schemas";

const repository = createFirestoreRepository<
  GlossaryEntry,
  CreateGlossaryEntryInput,
  UpdateGlossaryEntryInput
>({
  collectionName: FIRESTORE_COLLECTIONS.glossaryEntries,
  entityName: "glossary entry",
  converter: glossaryEntryConverter,
  createSchema: createGlossaryEntrySchema,
  updateSchema: updateGlossaryEntrySchema,
});

export const glossaryRepository = {
  ...repository,
  getAll: () => repository.getAll({ orderBy: "key" }),
  getByKey: (key: string) =>
    repository.findOne({
      filters: [{ field: "key", operator: "==", value: key }],
    }),
  getBySlug: (slug: string) =>
    repository.findOne({
      filters: [{ field: "slug", operator: "==", value: slug }],
    }),
};
