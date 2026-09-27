"use client";

import {
  ArrowUpRight,
  ChevronRight,
  Languages,
  LockKeyhole,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSelectedLayoutSegment } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const entries = [
  { key: "profile", href: "/settings/profile", icon: UserRound },
  { key: "account", href: "/settings/account", icon: SlidersHorizontal },
  { key: "privacy", href: "/settings/privacy", icon: ShieldCheck },
  { key: "preferences", href: "/settings/preferences", icon: Languages },
  { key: "security", href: "/settings/security", icon: LockKeyhole },
] as const;

function Navigation({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Settings.navigation");
  const segment = useSelectedLayoutSegment() ?? "profile";

  return (
    <nav
      className={cn(compact ? "grid gap-1 rounded-2xl border bg-card p-2" : "space-y-1")}
      aria-label={t("label")}
    >
      {entries.map(({ key, href, icon: Icon }) => {
        const active = segment === key;
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-safir/10 text-safir ring-1 ring-safir/15"
                : "text-muted-foreground hover:bg-muted/65 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{t(key)}</span>
            {compact ? <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Settings");

  return (
    <main className="site-container py-8 sm:py-12">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("description")}</p>
        <Link href="/account" className="mt-3 inline-flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground transition hover:text-safir">
          {t("navigation.viewProfile")} <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mb-6 lg:hidden">
        <Navigation compact />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="sticky top-6 hidden rounded-2xl border bg-card p-3 lg:block">
          <Navigation />
          <div className="mt-3 border-t pt-3">
            <Link href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-safir">
              {t("navigation.viewProfile")} <ArrowUpRight className="ml-auto size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
