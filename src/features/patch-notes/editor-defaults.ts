import type { PatchNoteEditorValue } from "@/features/patch-notes/types";

export function emptyPatchNoteEditorValue(): PatchNoteEditorValue {
  return {
    slug: "",
    version: "",
    category: "update",
    status: "draft",
    tags: [],
    scheduledAt: "",
    translations: {
      fr: { title: "", excerpt: "", blocks: [] },
      en: { title: "", excerpt: "", blocks: [] },
    },
  };
}
