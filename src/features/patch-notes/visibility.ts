import type { PatchNoteStatus } from "@/features/patch-notes/types";

export function isPatchNotePublic(status: PatchNoteStatus, visibleAt: Date | null, now: Date) {
  return (status === "published" || status === "scheduled") && Boolean(visibleAt && visibleAt.getTime() <= now.getTime());
}
