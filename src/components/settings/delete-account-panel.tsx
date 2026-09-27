"use client";

import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { deleteAccountAction } from "@/features/account/server/actions";
import { useRouter } from "@/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function DeleteAccountPanel({
  email,
  confirmationValue,
  supportsPassword,
}: {
  email: string;
  confirmationValue: string;
  supportsPassword: boolean;
}) {
  const t = useTranslations("Settings.account");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const validConfirmation = confirmation.trim().toLowerCase() === confirmationValue.toLowerCase();

  function removeAccount() {
    setError("");
    startTransition(async () => {
      try {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        if (!user || !email) throw new Error("AUTH_REQUIRED");
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, password));
        const idToken = await user.getIdToken(true);
        const sessionResponse = await fetch("/api/auth/user-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!sessionResponse.ok) throw new Error("AUTH_REQUIRED");
        const result = await deleteAccountAction(confirmation);
        if (!result.ok) {
          setError(t(`deleteErrors.${result.code}`));
          return;
        }
        await signOut(auth).catch(() => undefined);
        router.replace("/");
        router.refresh();
      } catch {
        setError(t("deleteErrors.AUTH_REQUIRED"));
      }
    });
  }

  if (!supportsPassword) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-muted/55 p-4 text-sm text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="leading-6">{t("deleteProviderUnsupported")}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/8" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden="true" /> {t("deleteAccount")}
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-destructive/25 bg-destructive/4 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <p className="text-sm leading-6 text-muted-foreground">{t("deleteWarning")}</p>
      </div>
      <div className="space-y-1.5">
        <label className="admin-label" htmlFor="delete-confirmation">{t("confirmLabel", { value: confirmationValue })}</label>
        <input id="delete-confirmation" className="admin-input" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
      </div>
      <div className="space-y-1.5">
        <label className="admin-label" htmlFor="delete-password">{t("passwordLabel")}</label>
        <input id="delete-password" type="password" className="admin-input" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
      </div>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="destructive" disabled={pending || !password || !validConfirmation} onClick={removeAccount}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
          {t("confirmDelete")}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => { setOpen(false); setPassword(""); setConfirmation(""); setError(""); }}>
          {t("cancelDelete")}
        </Button>
      </div>
    </div>
  );
}
