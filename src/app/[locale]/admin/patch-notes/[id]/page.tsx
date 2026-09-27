import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PatchNoteEditor } from "@/components/patch-notes/patch-note-editor";
import { patchNoteToEditorValue } from "@/features/patch-notes/server/patch-note-service";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { patchNotesRepository } from "@/repositories/patch-notes.repository";

export default async function EditPatchNotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ id }, query, locale, t] = await Promise.all([params, searchParams, getAdminLocale(), getTranslations("PatchNotes.admin.editor")]);
  const note = await patchNotesRepository.getById(id);
  if (!note) notFound();
  const title = getTranslation(note.translations, locale)?.title || note.slug;
  return <><AdminBreadcrumbTitle title={title} /><AdminPageHeader eyebrow={t("editEyebrow")} title={title} description={t("editDescription")} /><PatchNoteEditor initialValue={patchNoteToEditorValue(note)} startInPreview={query.preview === "1"} /></>;
}
