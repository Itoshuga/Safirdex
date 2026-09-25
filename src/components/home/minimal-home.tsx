import { useTranslations } from "next-intl";

import { CodexSearch } from "@/components/home/codex-search";
import { SiteHeader } from "@/components/layout/site-header";
import type { HomeCardSearchItem } from "@/features/cards/types";

export function MinimalHome({
  cards,
  signedIn,
}: {
  cards: HomeCardSearchItem[];
  signedIn: boolean;
}) {
  const t = useTranslations("Home");

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[44rem] opacity-50 [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--border)_52%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--border)_52%,transparent)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)] dark:opacity-25" />
        <div className="absolute top-[-28rem] left-1/2 h-[38rem] w-[58rem] -translate-x-1/2 rotate-[-8deg] bg-safir/9 blur-[100px]" />
      </div>

      <SiteHeader signedIn={signedIn} />

      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-5xl flex-col items-center px-5 pt-[12svh] text-center sm:px-8 sm:pt-[14svh]">
        <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.12em] text-safir uppercase">
          <span className="size-1.5 bg-safir" />
          {t("hero.eyebrow")}
        </div>
        <h1 className="mt-6 font-heading text-[clamp(4.2rem,13vw,8.6rem)] leading-[0.86] font-semibold tracking-[-0.075em] text-foreground">
          {t("hero.title")}
        </h1>
        <p className="mt-7 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {t("hero.description")}
        </p>
        <CodexSearch cards={cards} />
      </main>

      <footer className="relative z-10 mx-auto flex min-h-20 w-full max-w-[90rem] flex-col items-center justify-between gap-2 border-t border-border/55 px-5 py-6 text-[0.68rem] text-muted-foreground sm:flex-row sm:px-8 lg:px-12">
        <p>© {new Date().getFullYear()} {t("footer")}</p>
        <p className="flex items-center gap-2"><span className="size-1.5 bg-emerald-500" />{t("search.count", { count: cards.length })}</p>
      </footer>
    </div>
  );
}
