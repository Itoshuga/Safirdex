import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";

import type { PatchNoteListItem } from "@/features/patch-notes/types";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

export async function PatchNoteCard({ item, locale, featured = false }: { item: PatchNoteListItem; locale: AppLocale; featured?: boolean }) {
  const [category, listing, format] = await Promise.all([getTranslations({ locale, namespace: "PatchNotes.category" }), getTranslations({ locale, namespace: "PatchNotes.listing" }), getFormatter({ locale })]);
  const date = format.dateTime(new Date(item.publishedAtIso), "long");
  return (
    <article className={featured ? "group grid overflow-hidden rounded-[2rem] border bg-card shadow-[0_24px_80px_-54px_rgba(15,23,42,.55)] lg:grid-cols-[1.12fr_.88fr]" : "group overflow-hidden rounded-2xl border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_-40px_rgba(15,23,42,.55)]"}>
      <Link href={`/patch-notes/${item.slug}`} className={featured ? "relative min-h-64 overflow-hidden bg-muted lg:min-h-[25rem]" : "relative block aspect-[16/10] overflow-hidden bg-muted"}>
        {item.coverImage ? <Image src={item.coverImage.url} alt={item.coverImage.alt} fill className="object-cover transition duration-700 group-hover:scale-[1.025]" sizes={featured ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"} priority={featured} /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,color-mix(in_oklch,var(--safir)_30%,transparent),transparent_43%),linear-gradient(145deg,var(--muted),var(--background))]" />}
      </Link>
      <div className={featured ? "flex flex-col justify-center p-7 sm:p-10 lg:p-12" : "p-5 sm:p-6"}>
        <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold tracking-[0.1em] uppercase"><span className="text-safir">{category(item.category)}</span>{item.version ? <><span className="text-border">/</span><span>{item.version}</span></> : null}</div>
        <h2 className={featured ? "mt-4 font-heading text-3xl leading-tight font-semibold tracking-[-0.05em] text-balance sm:text-5xl" : "mt-3 font-heading text-xl leading-snug font-semibold tracking-[-0.035em] text-balance"}><Link href={`/patch-notes/${item.slug}`}>{item.title}</Link></h2>
        <p className={featured ? "mt-5 text-sm leading-7 text-muted-foreground sm:text-base" : "mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground"}>{item.excerpt}</p>
        <div className="mt-6 flex items-center justify-between gap-3 text-xs text-muted-foreground"><time dateTime={item.publishedAtIso}>{date}</time><Link href={`/patch-notes/${item.slug}`} className="inline-flex items-center gap-1.5 font-semibold text-foreground group-hover:text-safir">{listing("readArticle")}<ArrowUpRight className="size-3.5" /></Link></div>
      </div>
    </article>
  );
}
