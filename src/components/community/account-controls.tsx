"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function AccountControls({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const t = useTranslations("Profile.account");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <aside className="rounded-2xl border bg-card p-5">
      <p className="eyebrow">{t("title")}</p>
      <p className="mt-4 truncate text-sm text-muted-foreground">{email}</p>
      <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
        {isAdmin ? (
          <Button variant="outline" nativeButton={false} render={<Link href="/admin" />}>
            <ShieldCheck /> {t("admin")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await fetch("/api/auth/user-session", { method: "DELETE" });
            await signOut(getFirebaseAuth()).catch(() => undefined);
            router.replace("/");
            router.refresh();
          }}
        >
          <LogOut /> {t("logout")}
        </Button>
      </div>
    </aside>
  );
}

