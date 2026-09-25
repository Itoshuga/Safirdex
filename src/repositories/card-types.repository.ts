import "server-only";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { cardTypeConverter } from "@/lib/firebase/converters/entities";
import { createFirestoreRepository } from "@/repositories/base.repository";
import type {
  CardType,
  CreateCardTypeInput,
  UpdateCardTypeInput,
} from "@/types/card-type";
import {
  createCardTypeSchema,
  updateCardTypeSchema,
} from "@/validation/schemas";

const repository = createFirestoreRepository<
  CardType,
  CreateCardTypeInput,
  UpdateCardTypeInput
>({
  collectionName: FIRESTORE_COLLECTIONS.cardTypes,
  entityName: "card type",
  converter: cardTypeConverter,
  createSchema: createCardTypeSchema,
  updateSchema: updateCardTypeSchema,
});

export const cardTypesRepository = {
  ...repository,
  getAll: () => repository.getAll({ orderBy: "slug" }),
  getBySlug: (slug: string) =>
    repository.findOne({
      filters: [{ field: "slug", operator: "==", value: slug }],
    }),
};
