import { GalleryVerticalEnd, Library } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export function CodexHeader({
  totalCount,
  pageSize,
}: {
  totalCount: number;
  pageSize: number;
}) {
  const t = useTranslations("Cards.hero");

  return (
    <section className="relative border-b">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="surface-grid absolute inset-0 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute -top-44 left-[12%] size-80 rounded-full bg-safir/10 blur-3xl" />
      </div>

      <div className="site-container relative py-9 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)] lg:items-end">
          <div>
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("description")}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/88 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">
                <GalleryVerticalEnd className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {t("summaryEyebrow")}
                </p>
                <p className="mt-1 font-heading text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                  {t("cardCount", { count: totalCount })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t bg-muted/15">
              <div className="px-5 py-3.5 sm:px-6">
                <p className="text-[0.65rem] font-medium text-muted-foreground">{t("pageSizeLabel")}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                  {t("pageSize", { count: pageSize })}
                </p>
              </div>
              <div className="border-l px-5 py-3.5 sm:px-6">
                <p className="text-[0.65rem] font-medium text-muted-foreground">{t("collectionLabel")}</p>
                <p className="mt-0.5 text-sm font-semibold">{t("collectionHint")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-4">
          <nav aria-label={t("navigationLabel")} className="flex gap-1 overflow-x-auto">
            <Link
              href="/cards"
              aria-current="page"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <GalleryVerticalEnd className="size-4" aria-hidden="true" />
              {t("allCards")}
            </Link>
            <Link
              href="/collection"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Library className="size-4" aria-hidden="true" />
              {t("myCollection")}
            </Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
