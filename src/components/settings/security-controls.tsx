"use client";

import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { SignOutButton } from "@/components/settings/sign-out-button";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function SecurityControls({
  email,
  supportsPassword,
}: {
  email: string;
  supportsPassword: boolean;
}) {
  const t = useTranslations("Settings.security");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");

  async function resetPassword() {
    setStatus("pending");
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{t("passwordTitle")}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {supportsPassword ? t("passwordDescription") : t("providerManaged")}
          </p>
        </div>
        {supportsPassword ? (
          <Button type="button" variant="outline" disabled={status === "pending"} onClick={() => void resetPassword()}>
            {status === "pending" ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
            {t("resetPassword")}
          </Button>
        ) : null}
      </div>
      {status === "sent" ? <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="size-4" /> {t("resetSent")}</p> : null}
      {status === "error" ? <p className="admin-error">{t("resetFailed")}</p> : null}
      <div className="border-t pt-6">
        <p className="text-sm font-semibold">{t("sessionTitle")}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("sessionDescription")}</p>
        <SignOutButton className="mt-4" />
      </div>
    </div>
  );
}
