import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { PatchNoteCard } from "@/components/patch-notes/patch-note-card";
import { Button } from "@/components/ui/button";
import { getPublishedPatchNotes } from "@/features/patch-notes/server/patch-note-service";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PatchNotes.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/patch-notes`, languages: { fr: "/fr/patch-notes", en: "/en/patch-notes" } },
    openGraph: { title: t("title"), description: t("description"), type: "website" },
  };
}

export default async function PatchNotesPage({ params, searchParams }: { params: Promise<{ locale: AppLocale }>; searchParams: Promise<{ cursor?: string }> }) {
  const [{ locale }, query, hero, listing] = await Promise.all([params, searchParams, getTranslations("PatchNotes.hero"), getTranslations("PatchNotes.listing")]);
  const page = await getPublishedPatchNotes(locale, query.cursor);
  const featured = !query.cursor ? page.items[0] : undefined;
  const archive = featured ? page.items.slice(1) : page.items;
  return <div className="min-h-screen bg-background">
    <PublicHeader />
    <main>
      <section className="relative overflow-hidden border-b bg-[linear-gradient(180deg,color-mix(in_oklch,var(--safir)_7%,transparent),transparent)]">
        <div className="pointer-events-none absolute -top-56 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-safir/8 blur-3xl" />
        <div className="site-container relative py-14 sm:py-20 lg:py-24">
          <p className="eyebrow flex items-center gap-2"><Newspaper className="size-3.5" />{hero("eyebrow")}</p>
          <h1 className="mt-4 max-w-4xl font-heading text-5xl leading-[.95] font-semibold tracking-[-0.065em] text-balance sm:text-7xl lg:text-8xl">{hero("title")}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{hero("description")}</p>
        </div>
      </section>
      <div className="site-container py-10 sm:py-14 lg:py-20">
        {page.items.length === 0 ? <div className="rounded-[2rem] border border-dashed px-6 py-24 text-center"><Newspaper className="mx-auto size-9 text-muted-foreground/50" /><h2 className="mt-5 font-heading text-2xl font-semibold">{listing("emptyTitle")}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{listing("emptyDescription")}</p></div> : <>
          {featured ? <section aria-labelledby="latest-title"><p id="latest-title" className="eyebrow mb-4">{listing("latest")}</p><PatchNoteCard item={featured} locale={locale} featured /></section> : null}
          {archive.length ? <section className={featured ? "mt-16 sm:mt-20" : ""} aria-labelledby="archive-title"><div className="mb-6 flex items-end justify-between border-b pb-4"><h2 id="archive-title" className="font-heading text-3xl font-semibold tracking-[-0.045em]">{listing("archive")}</h2></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{archive.map((item) => <PatchNoteCard key={item.id} item={item} locale={locale} />)}</div></section> : null}
          {page.nextCursor ? <div className="mt-12 flex justify-center border-t pt-8"><Button variant="outline" size="lg" nativeButton={false} render={<Link href={`/patch-notes?cursor=${encodeURIComponent(page.nextCursor)}`} prefetch={false} />}>{listing("loadMore")}</Button></div> : null}
        </>}
      </div>
    </main>
  </div>;
}
