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

function applyPrimaryFilter(query: Query<Card>, filters: CardsPageQuery["filters"]) {
  if (filters.typeId) {
    return query.where("typeIds", "array-contains", filters.typeId);
  }
  if (filters.seasonId) {
    return query.where("seasonId", "==", filters.seasonId);
  }
  if (filters.setId) {
    return query.where("setId", "==", filters.setId);
  }
  if (filters.rarityId) {
    return query.where("rarityId", "==", filters.rarityId);
  }
  if (filters.isCommander !== undefined) {
    return query.where("isCommander", "==", filters.isCommander);
  }
  if (filters.isPromo !== undefined) {
    return query.where("isPromo", "==", filters.isPromo);
  }
  return query;
}

async function getPage({
  filters,
  sort,
  cursor,
  cursorDirection,
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

    if (includeFilter) query = applyPrimaryFilter(query, filters);

    query = query
      .orderBy(orderField, direction)
      .orderBy(FieldPath.documentId(), direction);

    if (decodedCursor) {
      const cursorValue =
        orderField === "createdAt"
          ? Timestamp.fromMillis(decodedCursor.value)
          : decodedCursor.value;
      query = cursorDirection === "before"
        ? query.endBefore(cursorValue, decodedCursor.id)
        : query.startAfter(cursorValue, decodedCursor.id);
    }

    return decodedCursor && cursorDirection === "before"
      ? query.limitToLast(limit)
      : query.limit(limit);
  };

  logFirestoreRead("cardsRepository.getPage()", limit);
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
  const documents = snapshot.docs;
  const firstDocument = documents.at(0);
  const firstCard = firstDocument?.data();
  const lastDocument = documents.at(-1);
  const lastCard = lastDocument?.data();
  const nextCursor =
    lastDocument && lastCard
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
  const previousCursor =
    firstDocument && firstCard
      ? encodeCursor({
          version: 1,
          sort,
          value:
            orderField === "number"
              ? firstCard.number
              : firstCard.createdAt.toMillis(),
          id: firstDocument.id,
        })
      : null;

  return {
    items: documents.map((document) => document.data()),
    nextCursor,
    previousCursor,
  };
}

async function count(filters: CardsPageQuery["filters"]) {
  const buildQuery = (includeFilter: boolean) => {
    const collection = getTypedAdminCollection(
      FIRESTORE_COLLECTIONS.cards,
      cardConverter,
    );
    return includeFilter ? applyPrimaryFilter(collection, filters) : collection;
  };

  logFirestoreRead("cardsRepository.count() aggregate");
  try {
    return (await buildQuery(true).count().get()).data().count;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/requires an index/i.test(message)) throw error;
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[Firestore] count index unavailable; using the unfiltered aggregate count",
      );
    }
    return (await buildQuery(false).count().get()).data().count;
  }
}

export const cardsRepository = {
  ...repository,
  getPage,
  count,
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
