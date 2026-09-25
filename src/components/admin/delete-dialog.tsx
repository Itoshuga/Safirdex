"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { AdminActionState } from "@/features/admin/action-state";
import { useRouter } from "@/i18n/navigation";

export function DeleteDialog({
  entityName,
  action,
  compact = false,
}: {
  entityName: string;
  action: () => Promise<AdminActionState>;
  compact?: boolean;
}) {
  const t = useTranslations("Admin.dialogs");
  const common = useTranslations("Common.actions");
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function close() {
    dialogRef.current?.close();
  }

  function confirm() {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      if (result.status === "success") {
        close();
        setSuccessMessage(result.message ?? t("deleted", { name: entityName }));
        window.setTimeout(() => setSuccessMessage(""), 4000);
        router.refresh();
      } else {
        setMessage(result.message ?? t("deletionFailed"));
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon-sm" : "sm"}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={t("deleteLabel", { name: entityName })}
      >
        <Trash2 />{compact ? null : common("delete")}
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm"
        onCancel={(event) => pending && event.preventDefault()}
      >
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"><Trash2 className="size-5" /></span>
            <Button variant="ghost" size="icon-sm" onClick={close} disabled={pending} aria-label={common("close")}><X /></Button>
          </div>
          <h2 className="font-heading text-2xl font-semibold">{t("deleteTitle", { name: entityName })}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("deleteDescription")}</p>
          {message ? <p className="mt-3 text-sm text-destructive" role="alert">{message}</p> : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={pending}>{common("cancel")}</Button>
            <Button type="button" variant="destructive" onClick={confirm} disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
              {pending ? common("deleting") : common("delete")}
            </Button>
          </div>
        </div>
      </dialog>
      {successMessage ? (
        <div className="fixed right-4 bottom-4 z-50 rounded-xl border bg-card px-4 py-3 text-sm shadow-2xl" role="status">
          {successMessage}
        </div>
      ) : null}
    </>
  );
}
