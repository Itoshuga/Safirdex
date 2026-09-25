"use client";

import { LogOut, Menu, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useRouter } from "@/i18n/navigation";

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const t = useTranslations("Admin.shell");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/auth/user-session", { method: "DELETE" });
    await getFirebaseAuth().signOut().catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background md:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r md:block">
        <AdminNavigation />
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden" />}>
              <Menu />
              <span className="sr-only">{t("openNavigation")}</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[17rem] p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">{t("navigationTitle")}</SheetTitle>
              <SheetDescription className="sr-only">{t("navigationDescription")}</SheetDescription>
              <AdminNavigation onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <AdminBreadcrumbs />
        </div>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <div className="hidden items-center gap-2 border-l pl-3 sm:flex">
            <span className="grid size-8 place-items-center rounded-lg bg-safir/12 text-safir"><ShieldCheck className="size-4" /></span>
            <div className="hidden max-w-36 lg:block">
              <p className="truncate text-xs font-semibold">{t("administrator")}</p>
              <p className="truncate text-[10px] text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={signingOut}
            onClick={handleSignOut}
            aria-label={t("signOut")}
            title={t("signOut")}
          >
            <LogOut />
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
