import "server-only";

import {
  FieldPath,
  Timestamp,
  type Query,
  type QuerySnapshot,
} from "firebase-admin/firestore";

import type {
  CardsPageQuery,
  CardsRepositoryPage,
} from "@/features/cards/server/query-types";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { cardConverter } from "@/lib/firebase/converters/entities";
import { getTypedAdminCollection } from "@/lib/firebase/firestore";
import { logFirestoreRead } from "@/lib/firebase/read-logger";
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

interface CursorPayload {
  version: 1;
  sort: CardsPageQuery["sort"];
  value: number;
  id: string;
}

function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string, sort: CardsPageQuery["sort"]) {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );
    if (
      !value ||
      typeof value !== "object" ||
      (value as CursorPayload).version !== 1 ||
      (value as CursorPayload).sort !== sort ||
      typeof (value as CursorPayload).value !== "number" ||
      typeof (value as CursorPayload).id !== "string"
    ) {
      return null;
    }
    return value as CursorPayload;
  } catch {
    return null;
  }
}

async function getPage({
  filters,
  sort,
  cursor,
  limit,
}: CardsPageQuery): Promise<CardsRepositoryPage> {
  const orderField = sort === "number" ? "number" : "createdAt";
  const direction = sort === "newest" ? "desc" : "asc";
  const decodedCursor = cursor ? decodeCursor(cursor, sort) : null;

  const buildQuery = (includeFilter: boolean) => {
    let query: Query<Card> = getTypedAdminCollection(
      FIRESTORE_COLLECTIONS.cards,
      cardConverter,
    );

    if (includeFilter) {
      if (filters.typeId) {
        query = query.where("typeIds", "array-contains", filters.typeId);
      } else if (filters.seasonId) {
        query = query.where("seasonId", "==", filters.seasonId);
      } else if (filters.setId) {
        query = query.where("setId", "==", filters.setId);
      } else if (filters.rarityId) {
        query = query.where("rarityId", "==", filters.rarityId);
      } else if (filters.isCommander !== undefined) {
        query = query.where("isCommander", "==", filters.isCommander);
      } else if (filters.isPromo !== undefined) {
        query = query.where("isPromo", "==", filters.isPromo);
      }
    }

    query = query
      .orderBy(orderField, direction)
      .orderBy(FieldPath.documentId(), direction);

    if (decodedCursor) {
      const cursorValue =
        orderField === "createdAt"
          ? Timestamp.fromMillis(decodedCursor.value)
          : decodedCursor.value;
      query = query.startAfter(cursorValue, decodedCursor.id);
    }

    return query.limit(limit + 1);
  };

  logFirestoreRead("cardsRepository.getPage()", limit + 1);
  let snapshot: QuerySnapshot<Card>;
  try {
    snapshot = await buildQuery(true).get();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/requires an index/i.test(message)) throw error;
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[Firestore] composite index unavailable; using bounded post-filtering",
      );
    }
    snapshot = await buildQuery(false).get();
  }
  const hasMore = snapshot.docs.length > limit;
  const documents = snapshot.docs.slice(0, limit);
  const lastDocument = documents.at(-1);
  const lastCard = lastDocument?.data();
  const nextCursor =
    hasMore && lastDocument && lastCard
      ? encodeCursor({
          version: 1,
          sort,
          value:
            orderField === "number"
              ? lastCard.number
              : lastCard.createdAt.toMillis(),
          id: lastDocument.id,
        })
      : null;

  return {
    items: documents.map((document) => document.data()),
    nextCursor,
    hasMore,
  };
}

export const cardsRepository = {
  ...repository,
  getPage,
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
