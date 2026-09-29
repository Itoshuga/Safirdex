import { ArrowRight, ArrowUpRight, Newspaper } from "lucide-react";
import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";

import type { PatchNoteListItem } from "@/features/patch-notes/types";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

export async function PatchNoteCard({ item, locale, featured = false }: { item: PatchNoteListItem; locale: AppLocale; featured?: boolean }) {
  const [category, listing, format] = await Promise.all([getTranslations({ locale, namespace: "PatchNotes.category" }), getTranslations({ locale, namespace: "PatchNotes.listing" }), getFormatter({ locale })]);
  const publishedAt = new Date(item.publishedAtIso);
  const date = format.dateTime(publishedAt, "long");
  const href = `/patch-notes/${item.slug}` as const;

  if (featured) {
    return (
      <article className="group overflow-hidden rounded-[1.75rem] border bg-card shadow-[0_24px_80px_-58px_rgba(15,23,42,.48)]">
        <Link href={href} className="grid lg:grid-cols-[minmax(18rem,.82fr)_minmax(0,1.18fr)]">
          <div className="relative min-h-60 overflow-hidden bg-muted sm:min-h-72 lg:min-h-[22rem]">
            {item.coverImage ? <Image src={item.coverImage.url} alt={item.coverImage.alt} fill className="object-cover transition duration-700 group-hover:scale-[1.025]" sizes="(max-width: 1024px) 100vw, 42vw" priority /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,color-mix(in_oklch,var(--safir)_32%,transparent),transparent_40%),linear-gradient(145deg,var(--muted),var(--background))]" />}
            <span className="absolute top-4 left-4 rounded-full border border-white/15 bg-background/85 px-3 py-1.5 text-[0.64rem] font-semibold tracking-[0.1em] uppercase shadow-sm backdrop-blur-md">{listing("latest")}</span>
          </div>
          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2 text-[0.66rem] font-semibold tracking-[0.1em] uppercase"><span className="text-safir">{category(item.category)}</span>{item.version ? <><span className="text-border">/</span><span>{item.version}</span></> : null}</div>
            <h2 className="mt-3 font-heading text-2xl leading-tight font-semibold tracking-[-0.045em] text-balance sm:text-4xl">{item.title}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{item.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t pt-5 text-xs text-muted-foreground"><time dateTime={item.publishedAtIso}>{date}</time><span className="inline-flex items-center gap-1.5 font-semibold text-foreground transition group-hover:text-safir">{listing("readArticle")}<ArrowUpRight className="size-3.5" /></span></div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group border-b last:border-b-0">
      <Link href={href} className="grid gap-4 py-6 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[9rem_minmax(0,1fr)_11rem] lg:items-center lg:py-7">
        <time dateTime={item.publishedAtIso} className="text-xs leading-5 font-medium text-muted-foreground sm:self-start lg:self-center">{date}</time>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[0.64rem] font-semibold tracking-[0.1em] uppercase"><span className="text-safir">{category(item.category)}</span>{item.version ? <><span className="text-border">/</span><span>{item.version}</span></> : null}</div>
          <h3 className="mt-2 font-heading text-xl leading-snug font-semibold tracking-[-0.035em] text-balance transition group-hover:text-safir sm:text-2xl">{item.title}</h3>
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground lg:hidden">{listing("readArticle")}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </div>
        <div className="relative hidden aspect-[16/10] overflow-hidden rounded-xl border bg-muted lg:block">
          {item.coverImage ? <Image src={item.coverImage.url} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.035]" sizes="176px" /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklch,var(--safir)_24%,transparent),transparent_45%),linear-gradient(145deg,var(--muted),var(--background))]"><Newspaper className="size-5 text-safir/70" /></div>}
        </div>
      </Link>
    </article>
  );
}
