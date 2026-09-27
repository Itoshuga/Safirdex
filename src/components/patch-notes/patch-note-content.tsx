"use client";

import { CircleAlert, CircleCheck, CircleHelp, ExternalLink, Info, Quote } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { PatchNoteRichText } from "@/components/patch-notes/rich-text";
import type { PatchNoteBlock } from "@/features/patch-notes/types";
import { getPatchNoteVideoEmbed } from "@/features/patch-notes/video";
import { cn } from "@/lib/utils";

function MediaFrame({ url, alt, priority = false }: { url: string; alt: string; priority?: boolean }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[1.4rem] border bg-muted shadow-[0_18px_60px_-36px_rgba(15,23,42,.45)]">
      <Image src={url} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 1100px" priority={priority} unoptimized={url.startsWith("blob:")} />
    </div>
  );
}

export function PatchNoteContent({ blocks, preview = false }: { blocks: PatchNoteBlock[]; preview?: boolean }) {
  const t = useTranslations("PatchNotes");
  return (
    <div className="w-full space-y-7 sm:space-y-9">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return <Tag id={`section-${block.id}`} key={block.id} className={cn("w-full scroll-mt-28 font-heading font-semibold tracking-[-0.04em] text-balance", block.level === 2 ? "pt-5 text-3xl sm:text-4xl" : "pt-3 text-2xl sm:text-3xl")}>{block.text}</Tag>;
        }
        if (block.type === "paragraph") return <p key={block.id} className="w-full text-base leading-8 text-muted-foreground sm:text-[1.08rem] sm:leading-9"><PatchNoteRichText nodes={block.content} /></p>;
        if (block.type === "image") return (
          <figure key={block.id} className="my-10 w-full">
            <MediaFrame url={block.image.url} alt={block.alt} priority={preview && index === 0} />
            {block.caption ? <figcaption className="mt-3 text-center text-xs leading-5 text-muted-foreground">{block.caption}</figcaption> : null}
          </figure>
        );
        if (block.type === "gallery") return (
          <div key={block.id} className="my-10 grid w-full gap-3 sm:grid-cols-2">
            {block.images.map((image) => <figure className={cn("min-w-0", block.images.length % 2 === 1 && block.images.at(-1)?.id === image.id && "sm:col-span-2")} key={image.id}><MediaFrame url={image.url} alt={image.alt} />{image.caption ? <figcaption className="mt-2 text-center text-xs text-muted-foreground">{image.caption}</figcaption> : null}</figure>)}
          </div>
        );
        if (block.type === "video") {
          const embed = getPatchNoteVideoEmbed(block.url);
          return <figure key={block.id} className="my-10 w-full">
            {embed ? <div className="aspect-video overflow-hidden rounded-[1.4rem] border bg-black shadow-[0_18px_60px_-36px_rgba(15,23,42,.45)]"><iframe className="size-full" src={embed.src} title={t("detail.videoTitle")} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div> : <a className="inline-flex items-center gap-2 text-safir hover:underline" href={block.url} target="_blank" rel="noreferrer noopener">{t("detail.openVideo")}<ExternalLink className="size-4" /></a>}
            {block.caption ? <figcaption className="mt-3 text-center text-xs text-muted-foreground">{block.caption}</figcaption> : null}
          </figure>;
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return <Tag key={block.id} className={cn("w-full space-y-3 pl-6 text-base leading-7 text-muted-foreground marker:font-semibold marker:text-safir", block.ordered ? "list-decimal" : "list-disc")}>{block.items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{item}</li>)}</Tag>;
        }
        if (block.type === "callout") {
          const Icon = block.variant === "success" ? CircleCheck : block.variant === "warning" ? CircleAlert : block.variant === "important" ? CircleHelp : Info;
          return <aside key={block.id} className={cn("w-full rounded-2xl border p-5 sm:p-6", block.variant === "success" && "border-emerald-500/25 bg-emerald-500/7", block.variant === "warning" && "border-amber-500/30 bg-amber-500/8", block.variant === "important" && "border-rose-500/25 bg-rose-500/7", block.variant === "info" && "border-safir/25 bg-safir/7")}><div className="flex gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-safir" /><div><p className="mb-1 font-semibold">{block.title || t(`callout.${block.variant}`)}</p><p className="leading-7 text-muted-foreground"><PatchNoteRichText nodes={block.content} /></p></div></div></aside>;
        }
        if (block.type === "quote") return <blockquote key={block.id} className="relative w-full border-l-2 border-safir py-2 pl-6 sm:pl-8"><Quote className="absolute -top-2 -left-3 size-6 fill-background text-safir" /><p className="font-heading text-xl leading-8 font-medium tracking-[-0.025em] text-balance sm:text-2xl">{block.text}</p>{block.author ? <footer className="mt-3 text-sm text-muted-foreground">— {block.author}</footer> : null}</blockquote>;
        return <hr key={block.id} className="my-12 w-full border-border/75" />;
      })}
    </div>
  );
}
