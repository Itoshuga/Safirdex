"use client";

import { Copy, LoaderCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Button } from "@/components/ui/button";
import type { AdminActionState } from "@/features/admin/action-state";

export function EntityRowActions({
  editHref,
  entityName,
  deleteAction,
  duplicateAction,
}: {
  editHref: string;
  entityName: string;
  deleteAction: () => Promise<AdminActionState>;
  duplicateAction?: () => Promise<AdminActionState>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function duplicate() {
    if (!duplicateAction) return;
    startTransition(async () => {
      const result = await duplicateAction();
      if (result.status === "success" && result.id) {
        router.push(`/admin/cards/${result.id}`);
      } else {
        setMessage(result.message ?? "Duplication failed.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button variant="ghost" size="icon-sm" render={<Link href={editHref} />} aria-label={`Edit ${entityName}`}>
        <Pencil />
      </Button>
      {duplicateAction ? (
        <Button variant="ghost" size="icon-sm" onClick={duplicate} disabled={pending} aria-label={`Duplicate ${entityName}`} title={message || "Duplicate"}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Copy />}
        </Button>
      ) : null}
      <DeleteDialog compact entityName={entityName} action={deleteAction} />
    </div>
  );
}
