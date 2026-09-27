"use client";

import { Copy, Eye, LoaderCircle, Pencil, Send, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Button } from "@/components/ui/button";
import type { AdminActionState } from "@/features/admin/action-state";
import { Link, useRouter } from "@/i18n/navigation";

export function PatchNoteRowActions({ id, slug, title, published, canUnpublish, deleteAction, duplicateAction, publishAction, unpublishAction }: { id: string; slug: string; title: string; published: boolean; canUnpublish: boolean; deleteAction: () => Promise<AdminActionState>; duplicateAction: () => Promise<AdminActionState>; publishAction: () => Promise<AdminActionState>; unpublishAction: () => Promise<AdminActionState> }) {
  const common = useTranslations("Common.actions");
  const t = useTranslations("PatchNotes.admin.list");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function run(action: () => Promise<AdminActionState>, redirectToCopy = false) {
    startTransition(async () => {
      const result = await action();
      if (result.status === "success") {
        if (redirectToCopy && result.id) router.push(`/admin/patch-notes/${result.id}`);
        else router.refresh();
      } else setMessage(result.message ?? "");
    });
  }
  return <div className="flex items-center justify-end gap-0.5" title={message}>
    <Button nativeButton={false} variant="ghost" size="icon-sm" render={<Link href={published ? `/patch-notes/${slug}` : `/admin/patch-notes/${id}?preview=1`} />} aria-label={`${t("preview")} ${title}`}><Eye /></Button>
    <Button nativeButton={false} variant="ghost" size="icon-sm" render={<Link href={`/admin/patch-notes/${id}`} />} aria-label={`${common("edit")} ${title}`}><Pencil /></Button>
    <Button variant="ghost" size="icon-sm" onClick={() => run(duplicateAction, true)} disabled={pending} aria-label={`${common("duplicate")} ${title}`}>{pending ? <LoaderCircle className="animate-spin" /> : <Copy />}</Button>
    {!published ? <Button variant="ghost" size="icon-sm" onClick={() => run(publishAction)} disabled={pending} aria-label={`${t("publish")} ${title}`}><Send /></Button> : null}
    {canUnpublish ? <Button variant="ghost" size="icon-sm" onClick={() => run(unpublishAction)} disabled={pending} aria-label={`${t("unpublish")} ${title}`}><Undo2 /></Button> : null}
    <DeleteDialog compact entityName={title} action={deleteAction} />
  </div>;
}
