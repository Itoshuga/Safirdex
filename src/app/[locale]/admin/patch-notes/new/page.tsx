import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PatchNoteEditor } from "@/components/patch-notes/patch-note-editor";
import { emptyPatchNoteEditorValue } from "@/features/patch-notes/editor-defaults";

export default async function NewPatchNotePage() {
  const t = await getTranslations("PatchNotes.admin.editor");
  return <><AdminPageHeader eyebrow={t("newEyebrow")} title={t("newTitle")} description={t("newDescription")} /><PatchNoteEditor initialValue={emptyPatchNoteEditorValue()} /></>;
}
