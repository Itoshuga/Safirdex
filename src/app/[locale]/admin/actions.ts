"use server";

import { randomUUID } from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import type { AdminActionState } from "@/features/admin/action-state";
import { compactTranslations } from "@/features/admin/form-mapping";
import { CODEX_CACHE_TAGS } from "@/features/cards/server/cache-tags";
import {
  buildCardDisplaySnapshot,
  syncCardTypeSnapshots,
  syncRaritySnapshots,
  syncSeasonSnapshots,
  syncSetSnapshots,
} from "@/features/cards/server/display-snapshots";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import {
  getFirebaseAdminFirestore,
  getFirebaseAdminStorage,
} from "@/lib/firebase/admin";
import { storagePaths } from "@/lib/firebase/storage-paths";
import { buildFirebaseStorageUrl } from "@/lib/firebase/public-url";
import { createUniqueSlug } from "@/lib/utils/slug";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { glossaryRepository } from "@/repositories/glossary.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";
import type { CreateCardSetInput } from "@/types/card-set";
import type { CreateCardTypeInput } from "@/types/card-type";
import type { CreateCardInput } from "@/types/card";
import type { CreateRarityInput } from "@/types/rarity";
import type { CreateSeasonInput } from "@/types/season";
import {
  createCardSchema,
  createCardSetSchema,
  createCardTypeSchema,
  createGlossaryEntrySchema,
  createRaritySchema,
  createSeasonSchema,
} from "@/validation/schemas";

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"],
]);
const maxImageSize = 15 * 1024 * 1024;

function jsonPayload(formData: FormData): Record<string, unknown> {
  const value = formData.get("payload");
  if (typeof value !== "string") throw new Error("The form payload is missing.");
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The form payload is invalid.");
  }
  return parsed as Record<string, unknown>;
}

function optionalFile(formData: FormData, name: string) {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

function validateImage(file: File, allowSvg = false) {
  const extension = allowedImageTypes.get(file.type);
  if (!extension || (!allowSvg && extension === "svg")) {
    throw new Error("Choose a JPG, PNG, WebP, or AVIF image.");
  }
  if (file.size > maxImageSize) {
    throw new Error("Images must be smaller than 15 MB.");
  }
  return extension;
}

async function uploadFile(file: File, storagePath: string) {
  const bucket = getFirebaseAdminStorage().bucket();
  const downloadToken = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  await bucket.file(storagePath).save(buffer, {
    resumable: false,
    metadata: {
      contentType: file.type,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });
  return buildFirebaseStorageUrl(bucket.name, storagePath, downloadToken);
}

async function deleteStoragePrefix(prefix: string) {
  await getFirebaseAdminStorage().bucket().deleteFiles({ prefix });
}

function dateValue(value: unknown) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid date.");
  return Timestamp.fromDate(date);
}

function withoutEmptyTranslations(payload: Record<string, unknown>) {
  const translations = compactTranslations(
    payload.translations as Record<string, Record<string, unknown>> | undefined,
  );
  return { ...payload, translations };
}

function zodErrors(error: z.ZodError, message: string) {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path.join("."), message]),
  );
}

async function failure(error: unknown): Promise<AdminActionState> {
  const t = await getTranslations("Admin.feedback");
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: t("reviewFields"),
      fieldErrors: zodErrors(error, t("invalidField")),
    };
  }
  const message = error instanceof Error ? error.message : t("operationFailed");
  if (message === "UNAUTHORIZED") {
    return { status: "error", message: t("sessionExpired") };
  }
  console.error("Admin mutation failed", error);
  if (
    /firebase|firestore|storage|permission[_ -]denied|\b(?:auth|app)\//i.test(
      message,
    )
  ) {
    return {
      status: "error",
      message: t("service"),
    };
  }
  return {
    status: "error",
    message: message.toLowerCase().includes("permission")
      ? t("permission")
      : t("operationFailed"),
  };
}

type EntityKey = "card" | "season" | "set" | "rarity" | "type" | "glossaryEntry";

function invalidateReferenceCache(entity: EntityKey) {
  const tag = {
    season: CODEX_CACHE_TAGS.seasons,
    set: CODEX_CACHE_TAGS.sets,
    rarity: CODEX_CACHE_TAGS.rarities,
    type: CODEX_CACHE_TAGS.types,
    glossaryEntry: CODEX_CACHE_TAGS.glossary,
    card: CODEX_CACHE_TAGS.cards,
  }[entity];
  updateTag(tag);
}

async function entityFeedback(action: "created" | "deleted", entity: EntityKey) {
  const [t, entities] = await Promise.all([
    getTranslations("Admin.feedback"),
    getTranslations("Admin.entities"),
  ]);
  return t(action, { entity: entities(entity) });
}

async function assertUniqueSlug(
  slug: string,
  lookup: (slug: string) => Promise<{ id: string } | null>,
  currentId?: string,
) {
  const existing = await lookup(slug);
  if (existing && existing.id !== currentId) {
    throw new Error(`The slug \"${slug}\" is already in use.`);
  }
}

async function validateSetSeason(setId: string | null, seasonId: string) {
  if (!setId) return;
  const set = await setsRepository.getById(setId);
  if (!set || set.seasonId !== seasonId) {
    throw new Error("The selected set does not belong to this season.");
  }
}

function normalizeCardPayload(payload: Record<string, unknown>) {
  const { primaryLocale, ...candidate } = payload;
  const locale = typeof primaryLocale === "string" ? primaryLocale : "fr";
  const translations = Object.fromEntries(
    Object.entries((candidate.translations as Record<string, { name?: string; description?: string }>) ?? {})
      .filter(([, translation]) => Boolean(translation.name?.trim() || translation.description?.trim())),
  );
  const parsed = createCardSchema.parse({ ...candidate, translations });
  if (!parsed.translations[locale]?.name.trim()) {
    throw new Error(`A ${locale.toUpperCase()} name is required.`);
  }
  return parsed;
}

async function prepareCardData(
  formData: FormData,
  cardId: string,
  existing?: CreateCardInput,
) {
  const payload = jsonPayload(formData);
  const mainFile = optionalFile(formData, "mainArtwork");
  const rawArtwork = payload.artwork as Record<string, unknown> | undefined;
  let mainStoragePath = String(rawArtwork?.storagePath ?? existing?.artwork.storagePath ?? "");

  if (mainFile) {
    const extension = validateImage(mainFile);
    mainStoragePath = storagePaths.cardMainArtwork(cardId, extension);
  } else if (!mainStoragePath) {
    throw new Error("A main artwork is required.");
  }

  const alternatives = Array.isArray(payload.alternativeArtworks)
    ? payload.alternativeArtworks.map((entry, index) => {
        const artwork = entry as Record<string, unknown>;
        const id = typeof artwork.id === "string" && artwork.id
          ? artwork.id
          : `alt_${randomUUID().replaceAll("-", "")}`;
        const file = optionalFile(formData, `alternativeArtwork:${id}`);
        let storagePath = String(artwork.storagePath ?? "");
        if (file) {
          const extension = validateImage(file);
          storagePath = storagePaths.cardAlternativeArtwork(cardId, id, extension);
        }
        if (!storagePath) throw new Error("Each alternative artwork needs an image.");
        return { ...artwork, id, storagePath, order: index, isPrimary: false };
      })
    : [];

  const data = normalizeCardPayload({
    ...payload,
    artwork: {
      ...rawArtwork,
      id: String(rawArtwork?.id ?? "main"),
      storagePath: mainStoragePath,
      isPrimary: true,
    },
    alternativeArtworks: alternatives,
  });

  await validateSetSeason(data.setId, data.seasonId);

  return { data, mainFile, alternatives };
}

async function uploadCardFiles(
  formData: FormData,
  data: CreateCardInput,
  mainFile: File | null,
) {
  const artwork = mainFile
    ? {
        ...data.artwork,
        url: await uploadFile(mainFile, data.artwork.storagePath),
      }
    : data.artwork;
  const alternativeArtworks = [];

  for (const entry of data.alternativeArtworks) {
    const file = optionalFile(formData, `alternativeArtwork:${entry.id}`);
    alternativeArtworks.push(
      file
        ? { ...entry, url: await uploadFile(file, entry.storagePath) }
        : entry,
    );
  }

  return { ...data, artwork, alternativeArtworks };
}

export async function createCardAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let cardId = "";
  try {
    await requireAdminSession();
    cardId = getFirebaseAdminFirestore().collection(FIRESTORE_COLLECTIONS.cards).doc().id;
    const { data, mainFile } = await prepareCardData(formData, cardId);
    await assertUniqueSlug(data.slug, cardsRepository.getBySlug);
    const uploadedData = await uploadCardFiles(formData, data, mainFile);
    const display = await buildCardDisplaySnapshot(uploadedData);
    await cardsRepository.createWithId(cardId, { ...uploadedData, display });
    updateTag(CODEX_CACHE_TAGS.cards);
    updateTag(CODEX_CACHE_TAGS.card(uploadedData.slug));
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/cards", "page");
    return { status: "success", message: await entityFeedback("created", "card"), id: cardId };
  } catch (error) {
    if (cardId) await deleteStoragePrefix(`cards/${cardId}/`).catch(() => undefined);
    return failure(error);
  }
}

export async function updateCardAction(
  id: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const existing = await cardsRepository.getByIdOrThrow(id);
    const { data, mainFile } = await prepareCardData(formData, id, existing);
    await assertUniqueSlug(data.slug, cardsRepository.getBySlug, id);
    const uploadedData = await uploadCardFiles(formData, data, mainFile);
    const display = await buildCardDisplaySnapshot(uploadedData);
    await cardsRepository.update(id, { ...uploadedData, display });

    const retained = new Set([
      uploadedData.artwork.storagePath,
      ...uploadedData.alternativeArtworks.map(({ storagePath }) => storagePath),
    ]);
    const removed = [existing.artwork, ...existing.alternativeArtworks].filter(
      ({ storagePath }) => !retained.has(storagePath),
    );
    await Promise.all(
      removed.map(({ storagePath }) =>
        getFirebaseAdminStorage().bucket().file(storagePath).delete({ ignoreNotFound: true }),
      ),
    );
    updateTag(CODEX_CACHE_TAGS.cards);
    updateTag(CODEX_CACHE_TAGS.card(existing.slug));
    updateTag(CODEX_CACHE_TAGS.card(uploadedData.slug));
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/cards", "page");
    revalidatePath("/[locale]/admin/cards/[id]", "page");
    const t = await getTranslations("Admin.feedback");
    return { status: "success", message: t("updated"), id };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCardAction(id: string): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const existing = await cardsRepository.getByIdOrThrow(id);
    await cardsRepository.remove(id);
    await deleteStoragePrefix(`cards/${id}/`);
    updateTag(CODEX_CACHE_TAGS.cards);
    updateTag(CODEX_CACHE_TAGS.card(existing.slug));
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/cards", "page");
    return { status: "success", message: await entityFeedback("deleted", "card") };
  } catch (error) {
    return failure(error);
  }
}

export async function duplicateCardAction(id: string): Promise<AdminActionState> {
  let newId = "";
  try {
    await requireAdminSession();
    const original = await cardsRepository.getByIdOrThrow(id);
    newId = getFirebaseAdminFirestore().collection(FIRESTORE_COLLECTIONS.cards).doc().id;
    const slug = await createUniqueSlug(`${original.slug}-copy`, async (candidate) =>
      Boolean(await cardsRepository.getBySlug(candidate)),
    );
    const rewrite = async (storagePath: string, nextPath: string) => {
      const bucket = getFirebaseAdminStorage().bucket();
      const [copiedFile] = await bucket.file(storagePath).copy(nextPath);
      const downloadToken = randomUUID();
      await copiedFile.setMetadata({
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      });
      return {
        storagePath: nextPath,
        url: buildFirebaseStorageUrl(bucket.name, nextPath, downloadToken),
      };
    };
    const mainExtension = original.artwork.storagePath.split(".").pop() ?? "webp";
    const artwork = {
      ...original.artwork,
      ...(await rewrite(
        original.artwork.storagePath,
        storagePaths.cardMainArtwork(newId, mainExtension),
      )),
    };
    const alternativeArtworks = await Promise.all(
      original.alternativeArtworks.map(async (entry, index) => {
        const extension = entry.storagePath.split(".").pop() ?? "webp";
        const artworkId = `alt_${randomUUID().replaceAll("-", "")}`;
        return {
          ...entry,
          id: artworkId,
          order: index,
          ...(await rewrite(
            entry.storagePath,
            storagePaths.cardAlternativeArtwork(
              newId,
              artworkId,
              extension,
            ),
          )),
        };
      }),
    );
    const display = await buildCardDisplaySnapshot(original);
    await cardsRepository.createWithId(newId, {
      number: original.number,
      slug,
      seasonId: original.seasonId,
      setId: original.setId,
      rarityId: original.rarityId,
      typeIds: original.typeIds,
      attack: original.attack,
      value: original.value,
      defense: original.defense,
      isCommander: original.isCommander,
      isPromo: original.isPromo,
      isFeatured: false,
      translations: original.translations,
      artwork,
      alternativeArtworks,
      display,
    });
    updateTag(CODEX_CACHE_TAGS.cards);
    updateTag(CODEX_CACHE_TAGS.card(slug));
    revalidatePath("/[locale]/admin/cards", "page");
    const t = await getTranslations("Admin.feedback");
    return { status: "success", message: t("duplicated"), id: newId };
  } catch (error) {
    if (newId) await deleteStoragePrefix(`cards/${newId}/`).catch(() => undefined);
    return failure(error);
  }
}

async function writeSeasonAtomically(
  id: string,
  data: CreateSeasonInput,
  mode: "create" | "update",
) {
  const firestore = getFirebaseAdminFirestore();
  const collection = firestore.collection(FIRESTORE_COLLECTIONS.seasons);
  const featured = data.isFeatured
    ? await collection.where("isFeatured", "==", true).get()
    : null;
  const batch = firestore.batch();
  const reference = collection.doc(id);
  const writeData = {
    ...data,
    ...(mode === "update" && !data.artwork
      ? { artwork: FieldValue.delete() }
      : {}),
    updatedAt: FieldValue.serverTimestamp(),
    ...(mode === "create" ? { createdAt: FieldValue.serverTimestamp() } : {}),
  };

  if (mode === "create") {
    batch.create(reference, writeData);
  } else {
    batch.update(reference, writeData);
  }

  for (const document of featured?.docs ?? []) {
    if (document.id !== id) {
      batch.update(document.ref, {
        isFeatured: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
}

function seasonPayload(payload: Record<string, unknown>) {
  return createSeasonSchema.parse({
    ...withoutEmptyTranslations(payload),
    releaseDate: dateValue(payload.releaseDate),
  });
}

export async function createSeasonAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let id = "";
  try {
    await requireAdminSession();
    const payload = jsonPayload(formData);
    id = getFirebaseAdminFirestore().collection(FIRESTORE_COLLECTIONS.seasons).doc().id;
    const file = optionalFile(formData, "artwork");
    if (file) {
      const extension = validateImage(file);
      payload.artwork = { storagePath: storagePaths.seasonCover(id, extension) };
    }
    const data = seasonPayload(payload);
    await assertUniqueSlug(data.slug, seasonsRepository.getBySlug);
    if (file && data.artwork) {
      data.artwork.url = await uploadFile(file, data.artwork.storagePath);
    }
    await writeSeasonAtomically(id, data, "create");
    updateTag(CODEX_CACHE_TAGS.seasons);
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/seasons", "page");
    return { status: "success", message: await entityFeedback("created", "season"), id };
  } catch (error) {
    if (id) await deleteStoragePrefix(`seasons/${id}/`).catch(() => undefined);
    return failure(error);
  }
}

export async function updateSeasonAction(
  id: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const existing = await seasonsRepository.getByIdOrThrow(id);
    const payload = jsonPayload(formData);
    const file = optionalFile(formData, "artwork");
    if (file) {
      const extension = validateImage(file);
      payload.artwork = { storagePath: storagePaths.seasonCover(id, extension) };
    }
    const data = seasonPayload(payload);
    await assertUniqueSlug(data.slug, seasonsRepository.getBySlug, id);
    if (file && data.artwork) {
      data.artwork.url = await uploadFile(file, data.artwork.storagePath);
    }
    await writeSeasonAtomically(id, data, "update");
    await syncSeasonSnapshots(id);
    if (existing.artwork && !data.artwork) {
      await deleteStoragePrefix(`seasons/${id}/`);
    }
    updateTag(CODEX_CACHE_TAGS.seasons);
    updateTag(CODEX_CACHE_TAGS.cards);
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/seasons", "page");
    const t = await getTranslations("Admin.feedback");
    return { status: "success", message: t("updated"), id };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteSeasonAction(id: string): Promise<AdminActionState> {
  return deleteEntity(id, "season", seasonsRepository.remove, `seasons/${id}/`);
}

function setPayload(payload: Record<string, unknown>) {
  return createCardSetSchema.parse({
    ...withoutEmptyTranslations(payload),
    releaseDate: dateValue(payload.releaseDate),
  });
}

export async function createSetAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return saveSimpleEntity<CreateCardSetInput>(
    "set",
    formData,
    setPayload,
    setsRepository.getBySlug,
    setsRepository.create,
    "/admin/sets",
  );
}

export async function updateSetAction(
  id: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return updateSimpleEntity<CreateCardSetInput>(
    id,
    "set",
    formData,
    setPayload,
    setsRepository.getBySlug,
    setsRepository.update,
    "/admin/sets",
  );
}

export async function deleteSetAction(id: string): Promise<AdminActionState> {
  return deleteEntity(id, "set", setsRepository.remove);
}

function rarityPayload(payload: Record<string, unknown>) {
  return createRaritySchema.parse(withoutEmptyTranslations(payload));
}

export async function createRarityAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return saveVisualEntity<CreateRarityInput>("rarity", formData);
}

export async function updateRarityAction(
  id: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return saveVisualEntity<CreateRarityInput>("rarity", formData, id);
}

export async function deleteRarityAction(id: string): Promise<AdminActionState> {
  return deleteEntity(id, "rarity", raritiesRepository.remove, `rarities/${id}/`);
}

function typePayload(payload: Record<string, unknown>) {
  return createCardTypeSchema.parse(withoutEmptyTranslations(payload));
}

export async function createTypeAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return saveVisualEntity<CreateCardTypeInput>("type", formData);
}

export async function updateTypeAction(
  id: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return saveVisualEntity<CreateCardTypeInput>("type", formData, id);
}

export async function deleteTypeAction(id: string): Promise<AdminActionState> {
  return deleteEntity(id, "type", cardTypesRepository.remove, `card-types/${id}/`);
}

async function saveVisualEntity<T extends CreateRarityInput | CreateCardTypeInput>(
  kind: "rarity" | "type",
  formData: FormData,
  id?: string,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const repository = kind === "rarity" ? raritiesRepository : cardTypesRepository;
    const payload = jsonPayload(formData);
    const entityId = id ?? getFirebaseAdminFirestore().collection(
      kind === "rarity" ? FIRESTORE_COLLECTIONS.rarities : FIRESTORE_COLLECTIONS.cardTypes,
    ).doc().id;
    const file = optionalFile(formData, "icon");
    if (file) {
      const extension = validateImage(file, true);
      const iconStoragePath = kind === "rarity"
        ? storagePaths.rarityIcon(entityId, extension)
        : storagePaths.cardTypeIcon(entityId, extension);
      payload.visual = { ...(payload.visual as object ?? {}), iconStoragePath };
    }
    const data = (kind === "rarity" ? rarityPayload(payload) : typePayload(payload)) as T;
    await assertUniqueSlug(data.slug, repository.getBySlug, id);
    if (file && data.visual?.iconStoragePath) {
      data.visual.iconUrl = await uploadFile(file, data.visual.iconStoragePath);
    }
    if (id) {
      await repository.update(id, data as never);
      if (kind === "rarity") {
        await syncRaritySnapshots(id);
      } else {
        await syncCardTypeSnapshots(id);
      }
    } else {
      await repository.createWithId(entityId, data as never);
    }
    invalidateReferenceCache(kind);
    updateTag(CODEX_CACHE_TAGS.cards);
    revalidatePath("/[locale]/admin", "page");
    revalidatePath(kind === "rarity" ? "/[locale]/admin/rarities" : "/[locale]/admin/types", "page");
    return {
      status: "success",
      message: id
        ? (await getTranslations("Admin.feedback"))("updated")
        : await entityFeedback("created", kind),
      id: entityId,
    };
  } catch (error) {
    return failure(error);
  }
}

function glossaryPayload(payload: Record<string, unknown>) {
  return createGlossaryEntrySchema.parse(withoutEmptyTranslations(payload));
}

export async function createGlossaryAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const data = glossaryPayload(jsonPayload(formData));
    await assertUniqueSlug(data.slug, glossaryRepository.getBySlug);
    if (await glossaryRepository.getByKey(data.key)) {
      throw new Error(`The glossary key \"${data.key}\" is already in use.`);
    }
    const entry = await glossaryRepository.create(data);
    invalidateReferenceCache("glossaryEntry");
    revalidatePath("/[locale]/admin", "page");
    revalidatePath("/[locale]/admin/glossary", "page");
    return { status: "success", message: await entityFeedback("created", "glossaryEntry"), id: entry.id };
  } catch (error) {
    return failure(error);
  }
}

export async function updateGlossaryAction(
  id: string,
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const data = glossaryPayload(jsonPayload(formData));
    await assertUniqueSlug(data.slug, glossaryRepository.getBySlug, id);
    const sameKey = await glossaryRepository.getByKey(data.key);
    if (sameKey && sameKey.id !== id) {
      throw new Error(`The glossary key \"${data.key}\" is already in use.`);
    }
    await glossaryRepository.update(id, data);
    invalidateReferenceCache("glossaryEntry");
    revalidatePath("/[locale]/admin/glossary", "page");
    const t = await getTranslations("Admin.feedback");
    return { status: "success", message: t("updated"), id };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteGlossaryAction(id: string): Promise<AdminActionState> {
  return deleteEntity(id, "glossary entry", glossaryRepository.remove);
}

async function saveSimpleEntity<T extends { slug: string }>(
  name: string,
  formData: FormData,
  parse: (payload: Record<string, unknown>) => T,
  lookup: (slug: string) => Promise<{ id: string } | null>,
  create: (data: T) => Promise<{ id: string }>,
  path: string,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const data = parse(jsonPayload(formData));
    await assertUniqueSlug(data.slug, lookup);
    const entity = await create(data);
    invalidateReferenceCache(name as EntityKey);
    revalidatePath("/[locale]/admin", "page");
    revalidatePath(`/[locale]${path}`, "page");
    return { status: "success", message: await entityFeedback("created", name as EntityKey), id: entity.id };
  } catch (error) {
    return failure(error);
  }
}

async function updateSimpleEntity<T extends { slug: string }>(
  id: string,
  name: string,
  formData: FormData,
  parse: (payload: Record<string, unknown>) => T,
  lookup: (slug: string) => Promise<{ id: string } | null>,
  update: (id: string, data: T) => Promise<{ id: string }>,
  path: string,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const data = parse(jsonPayload(formData));
    await assertUniqueSlug(data.slug, lookup, id);
    await update(id, data);
    if (name === "set") {
      await syncSetSnapshots(id);
      updateTag(CODEX_CACHE_TAGS.cards);
    }
    invalidateReferenceCache(name as EntityKey);
    revalidatePath(`/[locale]${path}`, "page");
    const t = await getTranslations("Admin.feedback");
    return { status: "success", message: t("updated"), id };
  } catch (error) {
    return failure(error);
  }
}

async function deleteEntity(
  id: string,
  name: string,
  remove: (id: string) => Promise<void>,
  storagePrefix?: string,
): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    await remove(id);
    if (storagePrefix) await deleteStoragePrefix(storagePrefix);
    invalidateReferenceCache(
      (name === "glossary entry" ? "glossaryEntry" : name) as EntityKey,
    );
    if (["season", "set", "rarity", "type"].includes(name)) {
      updateTag(CODEX_CACHE_TAGS.cards);
    }
    revalidatePath("/[locale]/admin", "page");
    revalidatePath(`/[locale]/admin/${name === "type" ? "types" : name === "glossary entry" ? "glossary" : `${name}s`}`, "page");
    const entity = name === "glossary entry" ? "glossaryEntry" : name as EntityKey;
    return { status: "success", message: await entityFeedback("deleted", entity) };
  } catch (error) {
    return failure(error);
  }
}
