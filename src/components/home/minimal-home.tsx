import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import {
  CodexSearch,
  type CodexSearchCopy,
} from "@/components/home/codex-search";
import { LanguageMenu } from "@/components/layout/language-menu";
import { SafirLogo } from "@/components/layout/safir-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AppLocale } from "@/lib/i18n/locales";
import type { CardPreviewData } from "@/types/card-preview";

export interface MinimalHomeCopy {
  eyebrow: string;
  title: string;
  description: string;
  language: string;
  signIn: string;
  account: string;
  footer: string;
  catalogue: string;
  search: CodexSearchCopy;
}

export function MinimalHome({
  cards,
  locale,
  copy,
  signedIn,
}: {
  cards: CardPreviewData[];
  locale: AppLocale;
  copy: MinimalHomeCopy;
  signedIn: boolean;
}) {
  return (
    <div
      lang={locale}
      className="relative min-h-screen overflow-x-clip bg-background"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[44rem] opacity-50 [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--border)_52%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_52%,transparent)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)] dark:opacity-25" />
        <div className="absolute top-[-28rem] left-1/2 h-[38rem] w-[58rem] -translate-x-1/2 rotate-[-8deg] bg-safir/9 blur-[100px]" />
      </div>

      <header className="relative z-40 mx-auto flex h-20 w-full max-w-[90rem] items-center justify-between border-b border-border/55 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label="Safirdex — Home"
        >
          <SafirLogo className="size-8" />
          <span className="font-heading text-sm font-semibold tracking-[-0.02em]">Safirdex</span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageMenu currentLocale={locale} label={copy.language} />
          <ThemeToggle />
          <Link
            href={signedIn ? "/account" : "/login"}
            className="ml-2 inline-flex h-9 items-center gap-1.5 border-l pl-4 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <span>{signedIn ? copy.account : copy.signIn}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-5xl flex-col items-center px-5 pt-[12svh] text-center sm:px-8 sm:pt-[14svh]">
        <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.12em] text-safir uppercase">
          <span className="size-1.5 bg-safir" />
          {copy.eyebrow}
        </div>
        <h1 className="mt-6 font-heading text-[clamp(4.2rem,13vw,8.6rem)] leading-[0.86] font-semibold tracking-[-0.075em] text-foreground">
          {copy.title}
        </h1>
        <p className="mt-7 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {copy.description}
        </p>
        <CodexSearch cards={cards} locale={locale} copy={copy.search} />
      </main>

      <footer className="relative z-10 mx-auto flex min-h-20 w-full max-w-[90rem] flex-col items-center justify-between gap-2 border-t border-border/55 px-5 py-6 text-[0.68rem] text-muted-foreground sm:flex-row sm:px-8 lg:px-12">
        <p>© {new Date().getFullYear()} {copy.footer}</p>
        <p className="flex items-center gap-2"><span className="size-1.5 bg-emerald-500" />{cards.length} {copy.catalogue}</p>
      </footer>
    </div>
  );
}
