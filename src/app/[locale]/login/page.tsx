import { ArrowLeft, Bookmark, Cloud, Search } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AccountAuthForm } from "@/components/auth/account-auth-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SafirLogo } from "@/components/layout/safir-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link, redirect } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Auth.metadata" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: false } };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  if (await getUserSession()) {
    return redirect({ href: "/account", locale });
  }

  const { mode } = await searchParams;
  const initialMode = mode === "signup" ? "signup" : "signin";
  return <AuthPage initialMode={initialMode} />;
}

export async function AuthPage({ initialMode }: { initialMode: "signin" | "signup" }) {
  const t = await getTranslations("Auth");
  const features = [
    [Bookmark, t("aside.collectionTitle"), t("aside.collectionDescription")],
    [Search, t("aside.searchTitle"), t("aside.searchDescription")],
    [Cloud, t("aside.syncTitle"), t("aside.syncDescription")],
  ] as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-45 dark:opacity-20" />
      <div className="pointer-events-none absolute top-[-20rem] left-[12%] h-[34rem] w-[42rem] rotate-[-12deg] bg-safir/10 blur-[110px]" />

      <header className="relative z-10 mx-auto flex h-20 max-w-[90rem] items-center justify-between border-b border-border/55 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 text-sm font-semibold"
        >
          <SafirLogo className="size-8" />
          Safirdex
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/"
            className="hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            <ArrowLeft className="size-3.5" /> {t("backToCodex")}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center gap-14 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_31rem] lg:px-12 lg:py-16">
        <section className="hidden max-w-xl lg:block">
          <p className="mb-5 flex items-center gap-2.5 text-xs font-semibold tracking-[0.1em] text-safir uppercase">
            <span className="size-1.5 bg-safir" /> {t("aside.eyebrow")}
          </p>
          <h2 className="font-heading text-6xl leading-[0.98] font-semibold tracking-[-0.065em]">
            {t("aside.title")}
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            {t("aside.description")}
          </p>
          <div className="mt-10 grid grid-cols-3 border-y">
            {features.map(([Icon, title, description], index) => {
              const FeatureIcon = Icon as typeof Bookmark;
              return (
                <div
                  className="border-r px-4 py-6 first:pl-0 last:border-r-0"
                  key={String(title)}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="font-mono text-[0.62rem] text-muted-foreground/60">
                      0{index + 1}
                    </span>
                    <FeatureIcon className="size-4 text-safir" />
                  </div>
                  <h3 className="text-sm font-semibold">{String(title)}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    {String(description)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card/95 shadow-[0_32px_90px_-44px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <AccountAuthForm initialMode={initialMode} />
        </section>
      </div>
    </main>
  );
}
