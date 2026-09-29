import { ArrowLeft, ChevronDown, ListTree } from "lucide-react";
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
  const headings = note.blocks.filter((block): block is PatchNoteHeadingBlock => block.type === "heading");
  const contents: Array<{ heading: PatchNoteHeadingBlock; number: number; children: PatchNoteHeadingBlock[] }> = [];
  headings.forEach((heading) => {
    if (heading.level === 2 || contents.length === 0) {
      contents.push({ heading, number: contents.length + 1, children: [] });
    } else {
      contents.at(-1)?.children.push(heading);
    }
  });
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
        <div className="mx-auto w-full max-w-[960px]">
          {contents.length ? <>
            <details className="group mb-10 overflow-hidden rounded-[1.35rem] border border-border/75 bg-card shadow-[0_18px_55px_-42px_rgba(15,23,42,.65)] lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 select-none [&::-webkit-details-marker]:hidden">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-safir/10 text-safir"><ListTree className="size-4" /></span>
                <span className="font-heading text-sm font-semibold tracking-[-0.01em]">{detail("contents")}</span>
                <span className="ml-auto rounded-full border bg-background px-2 py-0.5 font-mono text-[0.65rem] text-muted-foreground">{String(headings.length).padStart(2, "0")}</span>
                <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <nav className="space-y-1 border-t border-border/70 px-3 py-3" aria-label={detail("contents")}>
                {contents.map(({ heading, number, children }) => <div key={heading.id} className="rounded-xl px-1 py-1">
                  <a href={`#section-${heading.id}`} className="group/link flex items-start gap-3 rounded-lg px-2 py-2.5 text-sm text-muted-foreground transition hover:bg-safir/6 hover:text-foreground">
                    <span className="mt-0.5 w-5 shrink-0 font-mono text-[0.65rem] text-muted-foreground/65 transition group-hover/link:text-safir" aria-hidden="true">{String(number).padStart(2, "0")}</span>
                    <span className="leading-5">{heading.text}</span>
                  </a>
                  {children.map((child) => <a key={child.id} href={`#section-${child.id}`} className="group/link ml-10 flex items-start gap-2 rounded-lg px-2 py-2 text-[0.8rem] text-muted-foreground transition hover:bg-safir/6 hover:text-foreground"><span className="mt-2 size-1 shrink-0 rounded-full bg-current transition group-hover/link:bg-safir" aria-hidden="true" /><span className="leading-5">{child.text}</span></a>)}
                </div>)}
              </nav>
            </details>
            <nav className="mb-14 hidden overflow-hidden rounded-[1.5rem] border border-border/75 bg-card/80 p-3 shadow-[0_22px_70px_-52px_rgba(15,23,42,.8)] backdrop-blur-xl lg:block" aria-label={detail("contents")}>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-safir/10 text-safir"><ListTree className="size-4" /></span>
                <span className="font-heading text-sm font-semibold tracking-[-0.015em]">{detail("contents")}</span>
                <span className="ml-auto rounded-full border bg-background/80 px-2 py-0.5 font-mono text-[0.62rem] text-muted-foreground">{String(headings.length).padStart(2, "0")}</span>
              </div>
              <div className="mt-2 grid gap-2 border-t border-border/70 pt-3 lg:grid-cols-2">
                {contents.map(({ heading, number, children }) => <div key={heading.id} className="rounded-xl border border-transparent p-1 transition hover:border-border/70 hover:bg-background/45">
                  <a href={`#section-${heading.id}`} className="group/link flex items-start gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-foreground transition hover:text-safir">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-[0.62rem] text-muted-foreground transition group-hover/link:bg-safir/10 group-hover/link:text-safir" aria-hidden="true">{String(number).padStart(2, "0")}</span>
                    <span className="pt-1 leading-5">{heading.text}</span>
                  </a>
                  {children.length ? <div className="mb-1 ml-[2.85rem] space-y-0.5 border-l border-border/70 pl-3">{children.map((child) => <a key={child.id} href={`#section-${child.id}`} className="block rounded-md px-2 py-1.5 text-xs leading-5 text-muted-foreground transition hover:bg-safir/6 hover:text-safir">{child.text}</a>)}</div> : null}
                </div>)}
              </div>
            </nav>
          </> : null}
          <article className="mx-auto w-full min-w-0 max-w-[860px]"><PatchNoteContent blocks={note.blocks} /></article>
        </div>
      </div>
    </main>
  </div>;
}
