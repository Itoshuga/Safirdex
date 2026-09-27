"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations("Settings.security");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/user-session", { method: "DELETE" });
        await signOut(getFirebaseAuth()).catch(() => undefined);
        router.replace("/");
        router.refresh();
      }}
    >
      {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
      {t("signOut")}
    </Button>
  );
}
