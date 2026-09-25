"use client";

import { sendEmailVerification, signOut } from "firebase/auth";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  LogOut,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SafirLogo } from "@/components/layout/safir-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface AccountDashboardProps {
  user: {
    displayName: string;
    pseudonym: string;
    email: string;
    emailVerified: boolean;
    isAdmin: boolean;
    role: "user" | "admin";
  };
}

export function AccountDashboard({ user }: AccountDashboardProps) {
  const t = useTranslations("Account");
  const nav = useTranslations("Navigation");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSignOut() {
    setPending(true);
    await fetch("/api/auth/user-session", { method: "DELETE" });
    await signOut(getFirebaseAuth()).catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  async function resendVerification() {
    const auth = getFirebaseAuth();
    auth.languageCode = locale;
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setNotice(t("notices.signInAgain"));
      return;
    }

    setPending(true);
    try {
      await sendEmailVerification(currentUser);
      setNotice(t("notices.verificationSent"));
    } catch {
      setNotice(t("notices.verificationFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-35 dark:opacity-15" />
      <header className="relative z-10 mx-auto flex h-20 max-w-[90rem] items-center justify-between border-b border-border/55 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="group inline-flex items-center gap-3 text-sm font-semibold">
          <SafirLogo className="size-8" />
          Safirdex
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={handleSignOut}
            className="ml-1 text-muted-foreground"
          >
            <LogOut /> {nav("logout")}
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        {notice ? (
          <div className="mb-7 flex items-start gap-3 rounded-lg border border-safir/20 bg-safir/[0.06] px-4 py-3 text-sm text-foreground">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-safir" />
            <p className="leading-5">{notice}</p>
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-6 border-b pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-safir uppercase">
              <span className="size-1.5 bg-safir" /> {t("eyebrow")}
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {t("welcome", { name: user.displayName })}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <Badge variant="secondary" className="h-7 gap-2 px-2.5">
            <Sparkles className="size-3.5" /> {t("collectionStatus")}
          </Badge>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section className="relative overflow-hidden rounded-xl border bg-card p-6 sm:p-8">
            <div className="absolute top-0 right-0 size-44 translate-x-16 -translate-y-16 rotate-45 bg-safir/[0.06]" />
            <div className="relative max-w-xl">
              <span className="mb-8 grid size-11 place-items-center rounded-lg bg-safir/10 text-safir">
                <BookOpen className="size-5" />
              </span>
              <p className="font-mono text-xs text-muted-foreground">{t("collectionCount", { count: 0 })}</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em]">
                {t("emptyTitle")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("emptyDescription")}
              </p>
              <Button
                nativeButton={false}
                render={<Link href="/" />}
                className="mt-7 h-10"
              >
                {t("explore")} <ArrowRight />
              </Button>
            </div>
          </section>

          <aside className="rounded-xl border bg-card p-5">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {t("panelTitle")}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-safir text-sm font-bold text-safir-foreground">
                {user.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">@{user.pseudonym}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs">
              <span className="text-muted-foreground">{t("role")}</span>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? t("roles.admin") : t("roles.user")}
              </Badge>
            </div>

            <p className="mt-4 truncate text-xs text-muted-foreground">{user.email}</p>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center gap-2 text-xs">
                {user.emailVerified ? (
                  <>
                    <BadgeCheck className="size-4 text-emerald-500" />
                    <span>{t("emailVerified")}</span>
                  </>
                ) : (
                  <>
                    <MailCheck className="size-4 text-amber-500" />
                    <span>{t("emailUnverified")}</span>
                  </>
                )}
              </div>
              {!user.emailVerified ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={resendVerification}
                  className="mt-3 text-xs font-semibold text-safir hover:underline disabled:opacity-50"
                >
                  {t("resendEmail")}
                </button>
              ) : null}
            </div>

            {user.isAdmin ? (
              <Link
                href="/admin"
                className="mt-5 flex items-center gap-2 border-t pt-5 text-xs font-semibold text-safir hover:underline"
              >
                <ShieldCheck className="size-4" /> {t("openAdmin")}
              </Link>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
