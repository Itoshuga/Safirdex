"use client";

import { Copy, LoaderCircle, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { DeleteDialog } from "@/components/admin/delete-dialog";
import { Button } from "@/components/ui/button";
import type { AdminActionState } from "@/features/admin/action-state";
import { Link, useRouter } from "@/i18n/navigation";

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
  const common = useTranslations("Common.actions");
  const feedback = useTranslations("Admin.feedback");
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
        setMessage(result.message ?? feedback("duplicateFailed"));
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        nativeButton={false}
        variant="ghost"
        size="icon-sm"
        render={<Link href={editHref} />}
        aria-label={`${common("edit")} ${entityName}`}
      >
        <Pencil />
      </Button>
      {duplicateAction ? (
        <Button variant="ghost" size="icon-sm" onClick={duplicate} disabled={pending} aria-label={`${common("duplicate")} ${entityName}`} title={message || common("duplicate")}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Copy />}
        </Button>
      ) : null}
      <DeleteDialog compact entityName={entityName} action={deleteAction} />
    </div>
  );
}
