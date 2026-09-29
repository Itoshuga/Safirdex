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
        <div className="pointer-events-none absolute -top-64 right-0 size-[30rem] rounded-full bg-safir/7 blur-3xl" />
        <div className="site-container relative py-10 sm:py-14 lg:py-16">
          <p className="eyebrow flex items-center gap-2"><Newspaper className="size-3.5" />{hero("eyebrow")}</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight font-semibold tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl">{hero("title")}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{hero("description")}</p>
        </div>
      </section>
      <div className="site-container py-10 sm:py-14 lg:py-16">
        {page.items.length === 0 ? <div className="rounded-[1.75rem] border border-dashed bg-card/35 px-6 py-16 text-center sm:py-20"><div className="mx-auto grid size-12 place-items-center rounded-2xl border bg-background text-safir"><Newspaper className="size-5" /></div><h2 className="mt-5 font-heading text-2xl font-semibold tracking-[-0.035em]">{listing("emptyTitle")}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{listing("emptyDescription")}</p></div> : <>
          {featured ? <section aria-labelledby="latest-title"><h2 id="latest-title" className="sr-only">{listing("latest")}</h2><PatchNoteCard item={featured} locale={locale} featured /></section> : null}
          {archive.length ? <section className={featured ? "mt-12 sm:mt-16" : ""} aria-labelledby="archive-title"><div className="mb-2 flex items-end justify-between gap-4"><div><p className="eyebrow">{listing("timeline")}</p><h2 id="archive-title" className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{listing("archive")}</h2></div></div><div className="mt-5 border-t">{archive.map((item) => <PatchNoteCard key={item.id} item={item} locale={locale} />)}</div></section> : null}
          {page.nextCursor ? <div className="mt-12 flex justify-center border-t pt-8"><Button variant="outline" size="lg" nativeButton={false} render={<Link href={`/patch-notes?cursor=${encodeURIComponent(page.nextCursor)}`} prefetch={false} />}>{listing("loadMore")}</Button></div> : null}
        </>}
      </div>
    </main>
  </div>;
}
