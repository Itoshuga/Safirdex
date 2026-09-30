"use client";

import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function AdminUserPasswordReset({
  email,
  supportsPassword,
}: {
  email: string | null;
  supportsPassword: boolean;
}) {
  const t = useTranslations("Admin.users.security");
  const locale = useLocale();
  const [status, setStatus] = useState<
    "idle" | "pending" | "sent" | "error"
  >("idle");

  async function sendReset() {
    if (!email) return;
    setStatus("pending");
    try {
      const auth = getFirebaseAuth();
      auth.languageCode = locale;
      await sendPasswordResetEmail(auth, email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <p className="text-sm leading-6 text-muted-foreground">
        {!email
          ? t("missingEmail")
          : supportsPassword
            ? t("description", { email })
            : t("providerManaged")}
      </p>
      {email && supportsPassword ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={status === "pending"}
          onClick={() => void sendReset()}
        >
          {status === "pending" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <KeyRound />
          )}
          {t("action")}
        </Button>
      ) : null}
      {status === "sent" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="size-4" />
          {t("sent")}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="admin-error mt-3">{t("failed")}</p>
      ) : null}
    </div>
  );
}
