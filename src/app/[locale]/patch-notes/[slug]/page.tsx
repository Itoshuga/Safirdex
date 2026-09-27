import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { PatchNoteContent } from "@/components/patch-notes/patch-note-content";
import { PatchNoteShareButton } from "@/components/patch-notes/share-button";
import { getPublishedPatchNoteBySlug } from "@/features/patch-notes/server/patch-note-service";
import type { PatchNoteHeadingBlock } from "@/features/patch-notes/types";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const note = await getPublishedPatchNoteBySlug(slug, locale);
  if (!note) return {};
  return {
    title: `${note.title} — Safirdex`,
    description: note.excerpt,
    alternates: { canonical: `/${locale}/patch-notes/${slug}`, languages: { fr: `/fr/patch-notes/${slug}`, en: `/en/patch-notes/${slug}` } },
    openGraph: { title: note.title, description: note.excerpt, type: "article", publishedTime: note.publishedAtIso, ...(note.coverImage ? { images: [{ url: note.coverImage.url, alt: note.coverImage.alt }] } : {}) },
  };
}

export default async function PatchNotePage({ params }: { params: Promise<{ locale: AppLocale; slug: string }> }) {
  const { locale, slug } = await params;
  const [note, detail, category, format] = await Promise.all([getPublishedPatchNoteBySlug(slug, locale), getTranslations("PatchNotes.detail"), getTranslations("PatchNotes.category"), getFormatter({ locale })]);
  if (!note) notFound();
  const date = format.dateTime(new Date(note.publishedAtIso), "long");
  const headings = note.blocks.filter((block): block is PatchNoteHeadingBlock => block.type === "heading" && block.level === 2);
  return <div className="min-h-screen bg-background">
    <PublicHeader />
    <main>
      <header className="border-b bg-[linear-gradient(180deg,color-mix(in_oklch,var(--safir)_6%,transparent),transparent)]">
        <div className="site-container py-10 sm:py-16 lg:py-20">
          <Link href="/patch-notes" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-safir"><ArrowLeft className="size-3.5" />{detail("back")}</Link>
          <div className="mx-auto mt-10 max-w-4xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[0.7rem] font-semibold tracking-[0.11em] uppercase"><span className="text-safir">{category(note.category)}</span>{note.version ? <><span className="text-border">/</span><span>{note.version}</span></> : null}</div>
            <h1 className="mt-5 font-heading text-4xl leading-[1.02] font-semibold tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">{note.title}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{note.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"><time dateTime={note.publishedAtIso}>{detail("publishedOn", { date })}</time><span aria-hidden="true">·</span><span>{detail("by", { author: note.author.displayName })}</span><PatchNoteShareButton label={detail("share")} /></div>
          </div>
        </div>
      </header>
      {note.coverImage ? <div className="site-container -mb-2 pt-8 sm:pt-12"><div className="relative mx-auto aspect-[16/8.6] max-w-[76rem] overflow-hidden rounded-[1.5rem] border bg-muted shadow-[0_28px_90px_-58px_rgba(15,23,42,.65)] sm:rounded-[2rem]"><Image src={note.coverImage.url} alt={note.coverImage.alt} fill priority className="object-cover" sizes="(max-width: 1280px) 100vw, 1216px" /></div></div> : null}
      <div className="site-container py-12 sm:py-16 lg:py-24">
        {headings.length ? <details className="mb-10 rounded-2xl border bg-card p-5 lg:hidden"><summary className="cursor-pointer font-heading font-semibold">{detail("contents")}</summary><nav className="mt-4 space-y-2 border-t pt-4">{headings.map((heading) => <a key={heading.id} href={`#section-${heading.id}`} className="block text-sm text-muted-foreground hover:text-safir">{heading.text}</a>)}</nav></details> : null}
        <div className="mx-auto w-full max-w-[76rem]">
          {headings.length ? <nav className="mb-12 hidden w-full flex-wrap items-center gap-x-6 gap-y-3 border-y py-5 lg:flex" aria-label={detail("contents")}><span className="mr-auto text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{detail("contents")}</span>{headings.map((heading) => <a key={heading.id} href={`#section-${heading.id}`} className="text-sm leading-5 text-muted-foreground transition hover:text-safir">{heading.text}</a>)}</nav> : null}
          <article className="w-full min-w-0"><PatchNoteContent blocks={note.blocks} /></article>
        </div>
      </div>
    </main>
  </div>;
}
