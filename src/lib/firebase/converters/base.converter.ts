import "server-only";

import type {
  DocumentData,
  FirestoreDataConverter,
  PartialWithFieldValue,
  WithFieldValue,
} from "firebase-admin/firestore";
import type { z } from "zod";

function omitDocumentId<T extends { id: string }>(
  modelObject: WithFieldValue<T> | PartialWithFieldValue<T>,
) {
  const data: DocumentData = { ...modelObject };
  delete data.id;

  return data;
}

export function createAdminConverter<T extends { id: string }>(
  schema: z.ZodType<T>,
): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject) {
      return omitDocumentId(modelObject);
    },
    fromFirestore(snapshot) {
      return schema.parse({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
  };
}
