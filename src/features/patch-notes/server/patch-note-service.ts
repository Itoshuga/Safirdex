import "server-only";

import { unstable_cache } from "next/cache";

import { PATCH_NOTES_CACHE_TAGS } from "@/features/patch-notes/server/cache-tags";
import type { PatchNoteDetailView, PatchNoteDocument, PatchNoteListItem, PatchNotePage } from "@/features/patch-notes/types";
import { isPatchNotePublic } from "@/features/patch-notes/visibility";
import { firestoreDate, firestoreDateIso } from "@/lib/firebase/timestamp";
import type { AppLocale } from "@/lib/i18n/locales";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import { patchNotesRepository } from "@/repositories/patch-notes.repository";

function isVisible(note: PatchNoteDocument) {
  return isPatchNotePublic(note.status, firestoreDate(note.visibleAt), new Date());
}

function localizedTranslation(note: PatchNoteDocument, locale: AppLocale) {
  const requested = getTranslation(note.translations, locale);
  if (requested?.title.trim()) return requested;
  return note.translations.fr?.title.trim() ? note.translations.fr : requested;
}

function listItem(note: PatchNoteDocument, locale: AppLocale): PatchNoteListItem {
  const translation = localizedTranslation(note, locale) ?? { title: note.slug, excerpt: "", blocks: [] };
  const date = note.publishedAt ?? note.visibleAt ?? note.updatedAt;
  return {
    id: note.id,
    slug: note.slug,
    ...(note.version ? { version: note.version } : {}),
    category: note.category,
    title: translation.title,
    excerpt: translation.excerpt,
    ...(note.coverImage ? {
      coverImage: {
        id: note.coverImage.id,
        storagePath: note.coverImage.storagePath,
        url: note.coverImage.url,
        ...(note.coverImage.width ? { width: note.coverImage.width } : {}),
        ...(note.coverImage.height ? { height: note.coverImage.height } : {}),
        alt: getTranslation(note.coverImage.alt, locale) ?? translation.title,
      },
    } : {}),
    publishedAtIso: firestoreDateIso(date),
  };
}

export async function getPublishedPatchNotes(locale: AppLocale, cursor?: string): Promise<PatchNotePage> {
  if (cursor) {
    const page = await patchNotesRepository.listPublic(cursor);
    return { items: page.items.map((note) => listItem(note, locale)), ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}) };
  }
  const page = await unstable_cache(
    () => patchNotesRepository.listPublic(),
    ["published-patch-notes-v1"],
    { tags: [PATCH_NOTES_CACHE_TAGS.listing], revalidate: 60 },
  )();
  return { items: page.items.map((note) => listItem(note, locale)), ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}) };
}

export async function getLatestPatchNote(locale: AppLocale) {
  const page = await unstable_cache(
    () => patchNotesRepository.listPublic(undefined, 1),
    ["latest-patch-note-v1"],
    { tags: [PATCH_NOTES_CACHE_TAGS.latest], revalidate: 60 },
  )();
  return page.items[0] ? listItem(page.items[0], locale) : null;
}

export async function getPublishedPatchNoteBySlug(slug: string, locale: AppLocale): Promise<PatchNoteDetailView | null> {
  const note = await unstable_cache(
    () => patchNotesRepository.getBySlug(slug),
    ["patch-note-detail-v1", slug],
    { tags: [PATCH_NOTES_CACHE_TAGS.detail(slug)], revalidate: 3600 },
  )();
  if (!note || !isVisible(note)) return null;
  const translation = localizedTranslation(note, locale);
  if (!translation) return null;
  return {
    ...listItem(note, locale),
    blocks: translation.blocks,
    tags: note.tags,
    author: { displayName: note.author.displayName },
  };
}

export function patchNoteToEditorValue(note: PatchNoteDocument) {
  return {
    id: note.id,
    slug: note.slug,
    version: note.version ?? "",
    category: note.category,
    status: note.status,
    tags: note.tags,
    scheduledAt: firestoreDate(note.scheduledAt)?.toISOString() ?? "",
    ...(note.coverImage ? { coverImage: note.coverImage } : {}),
    translations: note.translations,
  };
}
