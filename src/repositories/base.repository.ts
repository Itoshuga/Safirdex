import "server-only";

import {
  FieldValue,
  type FirestoreDataConverter,
  type OrderByDirection,
  type Query,
  type WhereFilterOp,
} from "firebase-admin/firestore";
import { z } from "zod";

import type { FirestoreCollectionName } from "@/lib/firebase/collections";
import {
  getAdminCollection,
  getTypedAdminCollection,
} from "@/lib/firebase/firestore";
import {
  EntityNotFoundError,
  RepositoryValidationError,
} from "@/repositories/errors";

type EntityField<TEntity> = Extract<keyof TEntity, string>;

interface QueryFilter<TEntity> {
  field: EntityField<TEntity>;
  operator: WhereFilterOp;
  value: unknown;
}

interface QueryOptions<TEntity> {
  filters?: QueryFilter<TEntity>[];
  orderBy?: EntityField<TEntity>;
  direction?: OrderByDirection;
  limit?: number;
}

interface RepositoryOptions<TEntity extends { id: string }, TCreate, TUpdate> {
  collectionName: FirestoreCollectionName;
  entityName: string;
  converter: FirestoreDataConverter<TEntity>;
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
}

function parseInput<T>(
  schema: z.ZodType<T>,
  value: unknown,
  entityName: string,
) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new RepositoryValidationError(entityName, result.error);
  }

  return result.data;
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    );
  }

  return value;
}

export function createFirestoreRepository<
  TEntity extends { id: string },
  TCreate,
  TUpdate,
>({
  collectionName,
  entityName,
  converter,
  createSchema,
  updateSchema,
}: RepositoryOptions<TEntity, TCreate, TUpdate>) {
  const rawCollection = () => getAdminCollection(collectionName);
  const typedCollection = () =>
    getTypedAdminCollection(collectionName, converter);

  async function runQuery(options: QueryOptions<TEntity> = {}) {
    let query: Query<TEntity> = typedCollection();

    for (const filter of options.filters ?? []) {
      query = query.where(filter.field, filter.operator, filter.value);
    }

    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.direction ?? "asc");
    }

    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((document) => document.data());
  }

  async function getById(id: string) {
    const snapshot = await typedCollection().doc(id).get();
    return snapshot.data() ?? null;
  }

  async function getByIdOrThrow(id: string) {
    const entity = await getById(id);

    if (!entity) {
      throw new EntityNotFoundError(entityName, id);
    }

    return entity;
  }

  return {
    getAll: runQuery,
    getById,
    getByIdOrThrow,
    findOne: async (options: QueryOptions<TEntity>) => {
      const [entity] = await runQuery({ ...options, limit: 1 });
      return entity ?? null;
    },
    findMany: runQuery,
    create: async (data: TCreate) => {
      const validData = stripUndefined(
        parseInput(createSchema, data, entityName),
      );
      const reference = rawCollection().doc();

      await reference.create({
        ...(validData as object),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return getByIdOrThrow(reference.id);
    },
    createWithId: async (id: string, data: TCreate) => {
      const validData = stripUndefined(
        parseInput(createSchema, data, entityName),
      );
      const reference = rawCollection().doc(id);

      await reference.create({
        ...(validData as object),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return getByIdOrThrow(id);
    },
    update: async (id: string, data: TUpdate) => {
      await getByIdOrThrow(id);
      const validData = stripUndefined(
        parseInput(updateSchema, data, entityName),
      );

      await rawCollection()
        .doc(id)
        .update({
          ...(validData as object),
          updatedAt: FieldValue.serverTimestamp(),
        });

      return getByIdOrThrow(id);
    },
    remove: async (id: string) => {
      await getByIdOrThrow(id);
      await rawCollection().doc(id).delete();
    },
  };
}
