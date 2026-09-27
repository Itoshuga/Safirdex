"use server";

import { randomUUID } from "node:crypto";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import type { AdminActionState } from "@/features/admin/action-state";
import { PATCH_NOTES_CACHE_TAGS } from "@/features/patch-notes/server/cache-tags";
import type {
  PatchNoteBlock,
  PatchNoteDocument,
  PatchNoteEditorBlock,
  PatchNoteEditorImage,
  PatchNoteImageAsset,
} from "@/features/patch-notes/types";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { getFirebaseAdminFirestore, getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { buildFirebaseStorageUrl } from "@/lib/firebase/public-url";
import { storagePaths } from "@/lib/firebase/storage-paths";
import { createSlug, createUniqueSlug } from "@/lib/utils/slug";
import { patchNotesRepository } from "@/repositories/patch-notes.repository";
import { patchNoteEditorSchema, type PatchNoteEditorInput } from "@/validation/patch-notes";

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_DOCUMENT_PAYLOAD_SIZE = 750 * 1024;
type SaveIntent = "draft" | "publish" | "schedule";

function payloadFrom(formData: FormData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("PATCH_NOTE_PAYLOAD_MISSING");
  if (Buffer.byteLength(raw, "utf8") > MAX_DOCUMENT_PAYLOAD_SIZE) throw new Error("PATCH_NOTE_TOO_LARGE");
  return patchNoteEditorSchema.parse(JSON.parse(raw) as unknown);
}

function imageFile(formData: FormData, name: string) {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

function imageExtension(file: File) {
  const extension = IMAGE_TYPES.get(file.type);
  if (!extension) throw new Error("PATCH_NOTE_IMAGE_TYPE");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("PATCH_NOTE_IMAGE_SIZE");
  return extension;
}

async function uploadImage(file: File, storagePath: string): Promise<PatchNoteImageAsset> {
  const bucket = getFirebaseAdminStorage().bucket();
  const token = randomUUID();
  await bucket.file(storagePath).save(Buffer.from(await file.arrayBuffer()), {
    resumable: false,
    metadata: {
      contentType: file.type,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return {
    id: "",
    storagePath,
    url: buildFirebaseStorageUrl(bucket.name, storagePath, token),
  };
}

async function resolveImage(
  image: PatchNoteEditorImage,
  file: File | null,
  storagePathFor: (extension: string) => string,
  uploads?: Map<string, Promise<PatchNoteImageAsset>>,
) {
  if (file) {
    const existingUpload = uploads?.get(image.id);
    const upload = existingUpload ?? uploadImage(file, storagePathFor(imageExtension(file)));
    if (!existingUpload) uploads?.set(image.id, upload);
    const uploaded = await upload;
    return { ...uploaded, id: image.id, ...(image.width ? { width: image.width } : {}), ...(image.height ? { height: image.height } : {}) };
  }
  if (!image.storagePath || !image.url) throw new Error("PATCH_NOTE_IMAGE_MISSING");
  const expectedPrefix = storagePathFor("placeholder").replace(/placeholder$/, "");
  let hostname = "";
  try { hostname = new URL(image.url).hostname; } catch { throw new Error("PATCH_NOTE_IMAGE_SOURCE"); }
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST?.split(":")[0];
  if (!image.storagePath.startsWith(expectedPrefix) || (hostname !== "firebasestorage.googleapis.com" && hostname !== emulatorHost)) {
    throw new Error("PATCH_NOTE_IMAGE_SOURCE");
  }
  return {
    id: image.id,
    storagePath: image.storagePath,
    url: image.url,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  };
}

async function resolveBlock(block: PatchNoteEditorBlock, formData: FormData, noteId: string, uploads: Map<string, Promise<PatchNoteImageAsset>>): Promise<PatchNoteBlock> {
  if (block.type === "image") {
    return {
      ...block,
      image: await resolveImage(
        block.image,
        imageFile(formData, `media:${block.image.id}`),
        (extension) => storagePaths.patchNoteImage(noteId, block.image.id, extension),
        uploads,
      ),
    };
  }
  if (block.type === "gallery") {
    return {
      ...block,
      images: await Promise.all(block.images.map(async (image) => ({
        ...(await resolveImage(
          image,
          imageFile(formData, `media:${image.id}`),
          (extension) => storagePaths.patchNoteImage(noteId, image.id, extension),
          uploads,
        )),
        alt: image.alt,
        ...(image.caption ? { caption: image.caption } : {}),
      }))),
    };
  }
  return block;
}

async function resolveTranslations(input: PatchNoteEditorInput, formData: FormData, noteId: string) {
  const uploads = new Map<string, Promise<PatchNoteImageAsset>>();
  const entries = await Promise.all((["fr", "en"] as const).map(async (locale) => [
    locale,
    {
      ...input.translations[locale],
      blocks: await Promise.all(input.translations[locale].blocks.map((block) => resolveBlock(block, formData, noteId, uploads))),
    },
  ] as const));
  return Object.fromEntries(entries) as PatchNoteDocument["translations"];
}

function assertPublishable(input: PatchNoteEditorInput, intent: SaveIntent) {
  if (intent === "draft") return;
  const french = input.translations.fr;
  if (!french.title || !french.excerpt) throw new Error("PATCH_NOTE_FRENCH_REQUIRED");
  if (intent === "schedule") {
    const date = new Date(input.scheduledAt);
    if (!input.scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      throw new Error("PATCH_NOTE_FUTURE_DATE_REQUIRED");
    }
  }
  const missingAlt = french.blocks.some((block) =>
    (block.type === "image" && !block.alt) ||
    (block.type === "gallery" && block.images.some((image) => !image.alt)),
  );
  if (missingAlt || (input.coverImage && !input.coverImage.alt.fr?.trim())) {
    throw new Error("PATCH_NOTE_ALT_REQUIRED");
  }
}

function assertStoredPublishable(note: PatchNoteDocument) {
  const french = note.translations.fr;
  if (!french?.title.trim() || !french.excerpt.trim()) throw new Error("PATCH_NOTE_FRENCH_REQUIRED");
  const missingAlt = french.blocks.some((block) =>
    (block.type === "image" && !block.alt.trim()) ||
    (block.type === "gallery" && block.images.some((image) => !image.alt.trim())),
  );
  if (missingAlt || (note.coverImage && !note.coverImage.alt.fr?.trim())) throw new Error("PATCH_NOTE_ALT_REQUIRED");
}

function allStoragePaths(note: Pick<PatchNoteDocument, "coverImage" | "translations">) {
  const paths = new Set<string>();
  if (note.coverImage?.storagePath) paths.add(note.coverImage.storagePath);
  for (const translation of Object.values(note.translations)) {
    for (const block of translation.blocks) {
      if (block.type === "image") paths.add(block.image.storagePath);
      if (block.type === "gallery") block.images.forEach((image) => paths.add(image.storagePath));
    }
  }
  return paths;
}

function invalidate(oldSlug?: string, newSlug?: string) {
  updateTag(PATCH_NOTES_CACHE_TAGS.listing);
  updateTag(PATCH_NOTES_CACHE_TAGS.latest);
  if (oldSlug) updateTag(PATCH_NOTES_CACHE_TAGS.detail(oldSlug));
  if (newSlug) updateTag(PATCH_NOTES_CACHE_TAGS.detail(newSlug));
  revalidatePath("/[locale]/patch-notes", "page");
  revalidatePath("/[locale]/patch-notes/[slug]", "page");
  revalidatePath("/[locale]/admin/patch-notes", "page");
}

async function actionFailure(error: unknown): Promise<AdminActionState> {
  const t = await getTranslations("Admin.feedback");
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: t("reviewFields"),
      fieldErrors: Object.fromEntries(error.issues.map((issue) => [issue.path.join("."), t("invalidField")])),
    };
  }
  const code = error instanceof Error ? error.message : "";
  if (code === "UNAUTHORIZED") return { status: "error", message: t("sessionExpired") };
  const known = {
    PATCH_NOTE_PAYLOAD_MISSING: "patchNotePayloadMissing",
    PATCH_NOTE_IMAGE_TYPE: "patchNoteImageType",
    PATCH_NOTE_IMAGE_SIZE: "patchNoteImageSize",
    PATCH_NOTE_IMAGE_MISSING: "patchNoteImageMissing",
    PATCH_NOTE_IMAGE_SOURCE: "patchNoteImageSource",
    PATCH_NOTE_TOO_LARGE: "patchNoteTooLarge",
    PATCH_NOTE_FRENCH_REQUIRED: "patchNoteFrenchRequired",
    PATCH_NOTE_FUTURE_DATE_REQUIRED: "patchNoteFutureDateRequired",
    PATCH_NOTE_ALT_REQUIRED: "patchNoteAltRequired",
    PATCH_NOTE_NOT_FOUND: "patchNoteNotFound",
    PATCH_NOTE_SLUG_TAKEN: "patchNoteSlugTaken",
  } as const;
  const key = known[code as keyof typeof known];
  if (key) return { status: "error", message: t(key) };
  console.error("Patch note mutation failed", error);
  return { status: "error", message: t("operationFailed") };
}

async function save(id: string | null, intent: SaveIntent, formData: FormData): Promise<AdminActionState> {
  let createdId = "";
  try {
    const session = await requireAdminSession();
    const input = payloadFrom(formData);
    assertPublishable(input, intent);
    const existing = id ? await patchNotesRepository.getById(id) : null;
    if (id && !existing) throw new Error("PATCH_NOTE_NOT_FOUND");
    const noteId = id ?? getFirebaseAdminFirestore().collection(FIRESTORE_COLLECTIONS.patchNotes).doc().id;
    createdId = id ? "" : noteId;
    const fallbackSlug = existing?.slug ?? (input.translations.fr.title
      ? createSlug(input.translations.fr.title)
      : `draft-${noteId.toLowerCase()}`);
    const slug = input.slug || fallbackSlug;
    const sameSlug = await patchNotesRepository.getBySlug(slug);
    if (sameSlug && sameSlug.id !== noteId) throw new Error("PATCH_NOTE_SLUG_TAKEN");

    const translations = await resolveTranslations(input, formData, noteId);
    const coverImage = input.coverImage
      ? {
          ...(await resolveImage(
            input.coverImage,
            imageFile(formData, "coverFile"),
            (extension) => storagePaths.patchNoteCover(noteId, extension),
          )),
          alt: input.coverImage.alt,
        }
      : undefined;
    const now = Timestamp.now();
    const scheduledAt = intent === "schedule" ? Timestamp.fromDate(new Date(input.scheduledAt)) : null;
    const status = intent === "publish" ? "published" : intent === "schedule" ? "scheduled" : "draft";
    const sharedData = {
      slug,
      category: input.category,
      status,
      tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))],
      translations,
      author: { userId: session.uid, displayName: session.name ?? session.email ?? "Safir Codex" },
      publishedAt: intent === "publish" ? now : null,
      scheduledAt,
      visibleAt: intent === "publish" ? now : scheduledAt,
      updatedAt: now,
    } satisfies Partial<Omit<PatchNoteDocument, "id" | "createdAt">>;

    if (existing) {
      await patchNotesRepository.update(noteId, {
        ...sharedData,
        version: input.version || FieldValue.delete(),
        coverImage: coverImage ?? FieldValue.delete(),
      });
      const retained = allStoragePaths({ coverImage, translations });
      const removed = [...allStoragePaths(existing)].filter((path) => !retained.has(path));
      await Promise.all(removed.map((path) => getFirebaseAdminStorage().bucket().file(path).delete({ ignoreNotFound: true })));
    } else {
      await patchNotesRepository.createWithId(noteId, {
        ...sharedData,
        ...(input.version ? { version: input.version } : {}),
        ...(coverImage ? { coverImage } : {}),
        createdAt: now,
      } as Omit<PatchNoteDocument, "id">);
    }
    invalidate(existing?.slug, slug);
    const t = await getTranslations("Admin.feedback");
    const feedbackKey = intent === "draft" ? "patchNoteSaved" : intent === "publish" ? "patchNotePublished" : "patchNoteScheduled";
    return { status: "success", message: t(feedbackKey), id: noteId };
  } catch (error) {
    if (createdId) await getFirebaseAdminStorage().bucket().deleteFiles({ prefix: `patch-notes/${createdId}/` }).catch(() => undefined);
    return actionFailure(error);
  }
}

async function copiedAsset(asset: PatchNoteImageAsset, noteId: string, cache: Map<string, Promise<PatchNoteImageAsset>>) {
  const known = cache.get(asset.storagePath);
  if (known) return { ...asset, ...(await known), id: asset.id };
  const task = (async () => {
    const extension = asset.storagePath.split(".").pop()?.replace(/[^a-zA-Z0-9_-]/g, "") || "webp";
    const target = asset.storagePath.includes("/cover.")
      ? storagePaths.patchNoteCover(noteId, extension)
      : storagePaths.patchNoteImage(noteId, asset.id, extension);
    const bucket = getFirebaseAdminStorage().bucket();
    const [file] = await bucket.file(asset.storagePath).copy(target);
    const token = randomUUID();
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
    return { ...asset, storagePath: target, url: buildFirebaseStorageUrl(bucket.name, target, token) };
  })();
  cache.set(asset.storagePath, task);
  return { ...asset, ...(await task), id: asset.id };
}

export async function savePatchNoteAction(id: string | null, intent: SaveIntent, formData: FormData) {
  return save(id, intent, formData);
}

export async function deletePatchNoteAction(id: string): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const note = await patchNotesRepository.getById(id);
    if (!note) throw new Error("PATCH_NOTE_NOT_FOUND");
    await patchNotesRepository.remove(id);
    await getFirebaseAdminStorage().bucket().deleteFiles({ prefix: `patch-notes/${id}/` });
    invalidate(note.slug);
    return { status: "success", message: (await getTranslations("Admin.feedback"))("patchNoteDeleted") };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function unpublishPatchNoteAction(id: string): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const note = await patchNotesRepository.getById(id);
    if (!note) throw new Error("PATCH_NOTE_NOT_FOUND");
    await patchNotesRepository.update(id, { status: "draft", scheduledAt: null, visibleAt: null, updatedAt: Timestamp.now() });
    invalidate(note.slug);
    return { status: "success", message: (await getTranslations("Admin.feedback"))("patchNoteUnpublished"), id };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function publishPatchNoteAction(id: string): Promise<AdminActionState> {
  try {
    await requireAdminSession();
    const note = await patchNotesRepository.getById(id);
    if (!note) throw new Error("PATCH_NOTE_NOT_FOUND");
    assertStoredPublishable(note);
    const now = Timestamp.now();
    await patchNotesRepository.update(id, { status: "published", publishedAt: now, scheduledAt: null, visibleAt: now, updatedAt: now });
    invalidate(note.slug);
    return { status: "success", message: (await getTranslations("Admin.feedback"))("patchNotePublished"), id };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function duplicatePatchNoteAction(id: string): Promise<AdminActionState> {
  let newId = "";
  try {
    const session = await requireAdminSession();
    const original = await patchNotesRepository.getById(id);
    if (!original) throw new Error("PATCH_NOTE_NOT_FOUND");
    newId = getFirebaseAdminFirestore().collection(FIRESTORE_COLLECTIONS.patchNotes).doc().id;
    const slug = await createUniqueSlug(`${original.slug}-copy`, async (candidate) => Boolean(await patchNotesRepository.getBySlug(candidate)));
    const copied = new Map<string, Promise<PatchNoteImageAsset>>();
    const translations = Object.fromEntries(await Promise.all(Object.entries(original.translations).map(async ([locale, translation]) => [
      locale,
      {
        ...translation,
        blocks: await Promise.all(translation.blocks.map(async (block) => {
          if (block.type === "image") return { ...block, image: await copiedAsset(block.image, newId, copied) };
          if (block.type === "gallery") return { ...block, images: await Promise.all(block.images.map(async (image) => ({ ...image, ...(await copiedAsset(image, newId, copied)) }))) };
          return block;
        })),
      },
    ]))) as PatchNoteDocument["translations"];
    const coverImage = original.coverImage
      ? { ...(await copiedAsset(original.coverImage, newId, copied)), alt: original.coverImage.alt }
      : undefined;
    const now = Timestamp.now();
    await patchNotesRepository.createWithId(newId, {
      slug,
      ...(original.version ? { version: original.version } : {}),
      category: original.category,
      status: "draft",
      tags: original.tags,
      translations,
      ...(coverImage ? { coverImage } : {}),
      author: { userId: session.uid, displayName: session.name ?? session.email ?? "Safir Codex" },
      publishedAt: null,
      scheduledAt: null,
      visibleAt: null,
      createdAt: now,
      updatedAt: now,
    });
    invalidate(undefined, slug);
    return { status: "success", message: (await getTranslations("Admin.feedback"))("patchNoteDuplicated"), id: newId };
  } catch (error) {
    if (newId) await getFirebaseAdminStorage().bucket().deleteFiles({ prefix: `patch-notes/${newId}/` }).catch(() => undefined);
    return actionFailure(error);
  }
}
