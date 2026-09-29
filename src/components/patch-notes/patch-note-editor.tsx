"use client";

import { ArrowDown, ArrowUp, Copy, Eye, GripVertical, ImagePlus, Plus, Save, Send, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { PatchNoteContent } from "@/components/patch-notes/patch-note-content";
import { RichTextEditor } from "@/components/patch-notes/rich-text-editor";
import { deletePatchNoteBlock, insertPatchNoteBlockCopy, movePatchNoteBlock } from "@/features/patch-notes/editor-operations";
import { savePatchNoteAction } from "@/features/patch-notes/server/actions";
import { useRouter } from "@/i18n/navigation";
import type { PatchNoteBlock, PatchNoteEditorBlock, PatchNoteEditorImage, PatchNoteEditorValue } from "@/features/patch-notes/types";
import { createSlug } from "@/lib/utils/slug";
import { cn } from "@/lib/utils";

type Locale = "fr" | "en";
type PendingFile = { file: File; url: string };

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

function localDateTimeInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function newBlock(type: PatchNoteEditorBlock["type"]): PatchNoteEditorBlock {
  const id = uid("block");
  if (type === "heading") return { id, type, level: 2, text: "" };
  if (type === "paragraph") return { id, type, content: [] };
  if (type === "image") return { id, type, image: { id: uid("image") }, alt: "", caption: "", layout: "default" };
  if (type === "gallery") return { id, type, images: [], layout: "wide" };
  if (type === "video") return { id, type, url: "", caption: "", layout: "wide" };
  if (type === "list") return { id, type, ordered: false, items: [] };
  if (type === "callout") return { id, type, variant: "info", title: "", content: [] };
  if (type === "quote") return { id, type, text: "", author: "" };
  return { id, type: "divider" };
}

function imageIds(block: PatchNoteEditorBlock) {
  if (block.type === "image") return [block.image.id];
  if (block.type === "gallery") return block.images.map((image) => image.id);
  return [];
}

function blockComplete(block: PatchNoteEditorBlock) {
  if (block.type === "heading") return Boolean(block.text.trim());
  if (block.type === "paragraph" || block.type === "callout") return block.content.some((node) => node.text.trim());
  if (block.type === "image") return Boolean(block.alt.trim() && (block.image.url || block.image.id));
  if (block.type === "gallery") return block.images.length > 0 && block.images.every((image) => image.alt.trim());
  if (block.type === "video") return Boolean(block.url.trim());
  if (block.type === "list") return block.items.length > 0;
  if (block.type === "quote") return Boolean(block.text.trim());
  return true;
}

function previewBlocks(blocks: PatchNoteEditorBlock[], files: Map<string, PendingFile>): PatchNoteBlock[] {
  return blocks.flatMap((block) => {
    if (block.type === "image") {
      const url = files.get(block.image.id)?.url ?? block.image.url;
      return url ? [{ ...block, image: { id: block.image.id, storagePath: block.image.storagePath ?? "preview", url } } as PatchNoteBlock] : [];
    }
    if (block.type === "gallery") {
      const images = block.images.flatMap((image) => {
        const url = files.get(image.id)?.url ?? image.url;
        return url ? [{ ...image, storagePath: image.storagePath ?? "preview", url }] : [];
      });
      return images.length ? [{ ...block, images } as PatchNoteBlock] : [];
    }
    return [block as PatchNoteBlock];
  });
}

function ImageField({ image, alt, caption, layout, pending, onFile, onImage, onAlt, onCaption, onLayout, onRemove, labels }: { image: PatchNoteEditorImage; alt: string; caption?: string; layout: "default" | "wide"; pending?: PendingFile; onFile: (file: File) => void; onImage: (image: PatchNoteEditorImage) => void; onAlt: (value: string) => void; onCaption: (value: string) => void; onLayout: (value: "default" | "wide") => void; onRemove: () => void; labels: Record<string, string> }) {
  const url = pending?.url ?? image.url;
  const inputId = `file-${image.id}`;
  return <div className="grid w-full gap-4 sm:grid-cols-[9rem_1fr]">
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-dashed bg-muted/55">{url ? <Image src={url} alt="" fill className="object-cover" unoptimized={url.startsWith("blob:")} /> : <ImagePlus className="absolute top-1/2 left-1/2 size-7 -translate-1/2 text-muted-foreground/50" />}</div>
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2"><label htmlFor={inputId} className="inline-flex h-9 cursor-pointer items-center rounded-lg border bg-background px-3 text-xs font-semibold hover:bg-muted">{url ? labels.replaceImage : labels.chooseImage}</label>{url ? <button className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-destructive hover:bg-destructive/8" type="button" onClick={onRemove}><X className="size-3.5" />{labels.removeImage}</button> : null}<input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0]; if (file) { onFile(file); onImage({ ...image, storagePath: undefined, url: undefined }); } event.target.value = ""; }} /></div>
      <input className="admin-input" value={alt} onChange={(event) => onAlt(event.target.value)} placeholder={labels.alt} />
      <input className="admin-input" value={caption ?? ""} onChange={(event) => onCaption(event.target.value)} placeholder={labels.caption} />
      <select className="admin-input" value={layout} onChange={(event) => onLayout(event.target.value as "default" | "wide")}><option value="default">{labels.defaultLayout}</option><option value="wide">{labels.wideLayout}</option></select>
    </div>
  </div>;
}

export function PatchNoteEditor({ initialValue, startInPreview = false }: { initialValue: PatchNoteEditorValue; startInPreview?: boolean }) {
  const t = useTranslations("PatchNotes.admin.editor");
  const categories = useTranslations("PatchNotes.category");
  const router = useRouter();
  const [value, setValue] = useState(() => ({ ...initialValue, scheduledAt: localDateTimeInput(initialValue.scheduledAt) }));
  const [locale, setLocale] = useState<Locale>("fr");
  const [files, setFiles] = useState<Map<string, PendingFile>>(new Map());
  const filesRef = useRef(files);
  const allowLeaveRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [preview, setPreview] = useState(startInPreview);
  const [addType, setAddType] = useState<PatchNoteEditorBlock["type"]>("paragraph");
  const [dragging, setDragging] = useState<number | null>(null);
  const [autoSlug, setAutoSlug] = useState(!initialValue.slug);
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => () => { filesRef.current.forEach((entry) => URL.revokeObjectURL(entry.url)); }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty && !allowLeaveRef.current) event.preventDefault(); };
    const protectInternalNavigation = (event: MouseEvent) => {
      if (!dirty || allowLeaveRef.current || event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || new URL(anchor.href).origin !== window.location.origin) return;
      if (!window.confirm(t("leaveWarning"))) event.preventDefault();
      else allowLeaveRef.current = true;
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", protectInternalNavigation, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", protectInternalNavigation, true); };
  }, [dirty, t]);

  const translation = value.translations[locale];
  const previewContent = useMemo(() => previewBlocks(translation.blocks, files), [translation.blocks, files]);
  const labels = Object.fromEntries((["richText", "bold", "italic", "code", "link", "linkPrompt", "chooseImage", "replaceImage", "removeImage", "alt", "caption", "defaultLayout", "wideLayout"] as const).map((key) => [key, t(key)]));
  function update(next: Partial<PatchNoteEditorValue>) { allowLeaveRef.current = false; setValue((current) => ({ ...current, ...next })); setDirty(true); }
  function updateTranslation(next: Partial<typeof translation>) { allowLeaveRef.current = false; setValue((current) => ({ ...current, translations: { ...current.translations, [locale]: { ...current.translations[locale], ...next } } })); setDirty(true); }
  function updateBlock(index: number, block: PatchNoteEditorBlock) { const blocks = [...translation.blocks]; blocks[index] = block; updateTranslation({ blocks }); }
  function queueFile(id: string, file: File) { allowLeaveRef.current = false; setFiles((current) => { const next = new Map(current); const old = next.get(id); if (old) URL.revokeObjectURL(old.url); next.set(id, { file, url: URL.createObjectURL(file) }); return next; }); setDirty(true); }
  function removeFile(id: string) { setFiles((current) => { const next = new Map(current); const old = next.get(id); if (old) URL.revokeObjectURL(old.url); next.delete(id); return next; }); }
  function move(from: number, to: number) { updateTranslation({ blocks: movePatchNoteBlock(translation.blocks, from, to) }); }
  function removeBlock(index: number) { const block = translation.blocks[index]; if (block) imageIds(block).forEach(removeFile); updateTranslation({ blocks: deletePatchNoteBlock(translation.blocks, index) }); }
  function duplicateBlock(index: number) { const source = translation.blocks[index]; if (!source) return; const clone = structuredClone(source) as PatchNoteEditorBlock; clone.id = uid("block"); if (clone.type === "image") { const old = clone.image.id; clone.image.id = uid("image"); const file = files.get(old)?.file; if (file) queueFile(clone.image.id, file); } if (clone.type === "gallery") clone.images = clone.images.map((image) => { const id = uid("image"); const file = files.get(image.id)?.file; if (file) queueFile(id, file); return { ...image, id }; }); updateTranslation({ blocks: insertPatchNoteBlockCopy(translation.blocks, index, clone) }); }

  function save(intent: "draft" | "publish" | "schedule") {
    const formData = new FormData();
    formData.set("payload", JSON.stringify({
      ...value,
      scheduledAt: value.scheduledAt ? new Date(value.scheduledAt).toISOString() : "",
    }));
    files.forEach(({ file }, id) => { if (id === value.coverImage?.id) formData.set("coverFile", file); else formData.set(`media:${id}`, file); });
    setPending(true); setFeedback(null);
    startTransition(async () => {
      const result = await savePatchNoteAction(value.id ?? null, intent, formData);
      setPending(false);
      setFeedback({ status: result.status === "success" ? "success" : "error", message: result.message ?? "" });
      if (result.status === "success") {
        allowLeaveRef.current = true;
        setDirty(false);
        setValue((current) => ({ ...current, id: result.id, status: intent === "publish" ? "published" : intent === "schedule" ? "scheduled" : "draft" }));
        if (!initialValue.id && result.id) router.replace(`/admin/patch-notes/${result.id}`);
        router.refresh();
      }
    });
  }

  const localeComplete = (code: Locale) => { const item = value.translations[code]; return Boolean(item.title.trim() && item.excerpt.trim() && item.blocks.length && item.blocks.every(blockComplete)); };
  const coverUrl = value.coverImage ? files.get(value.coverImage.id)?.url ?? value.coverImage.url : undefined;
  if (preview) return <div className="space-y-6">
    <div className="sticky top-0 z-20 flex items-center justify-between rounded-xl border bg-background/90 p-3 shadow-sm backdrop-blur"><div><p className="text-xs font-semibold tracking-[.1em] text-safir uppercase">{t("preview")}</p><p className="text-xs text-muted-foreground">{locale === "fr" ? t("french") : t("english")}</p></div><button className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold" type="button" onClick={() => setPreview(false)}><X className="size-3.5" />{t("previewMode")}</button></div>
    <article className="mx-auto max-w-[76rem] overflow-hidden rounded-[2rem] border bg-background shadow-sm"><header className="px-6 py-12 text-center sm:px-12 sm:py-16"><p className="text-xs font-semibold tracking-[.12em] text-safir uppercase">{categories(value.category)}{value.version ? ` · ${value.version}` : ""}</p><h1 className="mx-auto mt-4 max-w-4xl font-heading text-4xl font-semibold tracking-[-.055em] text-balance sm:text-6xl">{translation.title || t("previewEmpty")}</h1><p className="mx-auto mt-5 max-w-2xl leading-7 text-muted-foreground">{translation.excerpt}</p></header>{coverUrl ? <div className="relative mx-auto aspect-[16/8] max-w-5xl overflow-hidden rounded-2xl"><Image src={coverUrl} alt={value.coverImage?.alt[locale] ?? ""} fill className="object-cover" unoptimized={coverUrl.startsWith("blob:")} /></div> : null}<div className="mx-auto max-w-[760px] px-6 py-12 sm:py-16"><PatchNoteContent blocks={previewContent} preview /></div></article>
  </div>;

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-2">
        <div className="flex gap-1" role="tablist">{(["fr", "en"] as const).map((code) => <button key={code} type="button" role="tab" aria-selected={locale === code} onClick={() => setLocale(code)} className={cn("flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition", locale === code ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><span>{code === "fr" ? t("french") : t("english")}</span><span className={cn("size-2 rounded-full", localeComplete(code) ? "bg-emerald-500" : "bg-amber-400")} aria-label={localeComplete(code) ? t("complete") : t("incomplete")} /></button>)}</div>
        <div className="flex flex-wrap items-center gap-1">{locale === "en" && value.translations.en.blocks.length === 0 && value.translations.fr.blocks.length > 0 ? <button type="button" onClick={() => updateTranslation({ blocks: structuredClone(value.translations.fr.blocks) })} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><Copy className="size-3.5" />{t("copyFrenchBlocks")}</button> : null}<button type="button" onClick={() => setPreview(true)} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><Eye className="size-4" />{t("preview")}</button></div>
      </div>
      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <div className="grid gap-5">
          <label className="space-y-2"><span className="admin-label">{t("title")}</span><input className="admin-input h-12 text-base" value={translation.title} placeholder={t("titlePlaceholder")} onChange={(event) => { const title = event.target.value; updateTranslation({ title }); if (locale === "fr" && autoSlug) { try { update({ slug: title ? createSlug(title) : "" }); } catch { update({ slug: "" }); } } }} /></label>
          <label className="space-y-2"><span className="admin-label">{t("excerpt")}</span><textarea className="admin-input min-h-24 resize-y py-3" value={translation.excerpt} placeholder={t("excerptPlaceholder")} onChange={(event) => updateTranslation({ excerpt: event.target.value })} /></label>
        </div>
      </section>
      <section className="w-full space-y-3">
        {translation.blocks.length === 0 ? <div className="w-full rounded-2xl border border-dashed bg-card px-6 py-14 text-center text-sm text-muted-foreground">{t("noBlocks")}</div> : translation.blocks.map((block, index) => <article key={block.id} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragging !== null) move(dragging, index); setDragging(null); }} className={cn("w-full overflow-hidden rounded-2xl border bg-card transition", dragging === index && "opacity-50")}>
          <div className="flex items-center gap-2 border-b bg-muted/25 px-3 py-2"><span draggable onDragStart={() => setDragging(index)} onDragEnd={() => setDragging(null)} className="cursor-grab active:cursor-grabbing"><GripVertical className="size-4 text-muted-foreground" /></span><span className="mr-auto text-[0.68rem] font-semibold tracking-[.1em] text-muted-foreground uppercase">{t(block.type)}</span><button type="button" className="rounded-md p-1.5 hover:bg-background disabled:opacity-35" disabled={index === 0} onClick={() => move(index, index - 1)} title={t("moveUp")}><ArrowUp className="size-3.5" /></button><button type="button" className="rounded-md p-1.5 hover:bg-background disabled:opacity-35" disabled={index === translation.blocks.length - 1} onClick={() => move(index, index + 1)} title={t("moveDown")}><ArrowDown className="size-3.5" /></button><button type="button" className="rounded-md p-1.5 hover:bg-background" onClick={() => duplicateBlock(index)} title={t("duplicate")}><Copy className="size-3.5" /></button><button type="button" className="rounded-md p-1.5 text-destructive hover:bg-destructive/8" onClick={() => removeBlock(index)} title={t("delete")}><Trash2 className="size-3.5" /></button></div>
          <div className="w-full p-4 sm:p-5">{block.type === "heading" ? <div className="grid w-full gap-3 sm:grid-cols-[7rem_1fr]"><select className="admin-input" value={block.level} onChange={(event) => updateBlock(index, { ...block, level: Number(event.target.value) as 2 | 3 })}><option value="2">H2</option><option value="3">H3</option></select><input className="admin-input" value={block.text} placeholder={t("headingText")} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} /></div> : null}
          {block.type === "paragraph" ? <RichTextEditor key={`${locale}:${block.id}:paragraph`} value={block.content} onChange={(content) => updateBlock(index, { ...block, content })} labels={labels as never} /> : null}
          {block.type === "image" ? <ImageField image={block.image} alt={block.alt} caption={block.caption} layout={block.layout} pending={files.get(block.image.id)} onFile={(file) => queueFile(block.image.id, file)} onImage={(image) => updateBlock(index, { ...block, image })} onAlt={(alt) => updateBlock(index, { ...block, alt })} onCaption={(caption) => updateBlock(index, { ...block, caption })} onLayout={(layout) => updateBlock(index, { ...block, layout })} onRemove={() => { removeFile(block.image.id); updateBlock(index, { ...block, image: { id: block.image.id } }); }} labels={labels} /> : null}
          {block.type === "gallery" ? <div className="w-full space-y-4">{block.images.map((image, imageIndex) => <div key={image.id} className="w-full rounded-xl border p-3"><ImageField image={image} alt={image.alt} caption={image.caption} layout={block.layout} pending={files.get(image.id)} onFile={(file) => queueFile(image.id, file)} onImage={(next) => { const images = [...block.images]; images[imageIndex] = { ...image, ...next }; updateBlock(index, { ...block, images }); }} onAlt={(alt) => { const images = [...block.images]; images[imageIndex] = { ...image, alt }; updateBlock(index, { ...block, images }); }} onCaption={(caption) => { const images = [...block.images]; images[imageIndex] = { ...image, caption }; updateBlock(index, { ...block, images }); }} onLayout={(layout) => updateBlock(index, { ...block, layout })} onRemove={() => { removeFile(image.id); updateBlock(index, { ...block, images: block.images.filter((_, itemIndex) => itemIndex !== imageIndex) }); }} labels={labels} /></div>)}<label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 text-xs font-semibold hover:bg-muted"><ImagePlus className="size-4" />{t("addImages")}<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const next = [...block.images]; Array.from(event.target.files ?? []).slice(0, 12 - next.length).forEach((file) => { const id = uid("image"); next.push({ id, alt: "", caption: "" }); queueFile(id, file); }); updateBlock(index, { ...block, images: next }); event.target.value = ""; }} /></label><select className="admin-input" value={block.layout} onChange={(event) => updateBlock(index, { ...block, layout: event.target.value as "default" | "wide" })}><option value="default">{t("defaultLayout")}</option><option value="wide">{t("wideLayout")}</option></select></div> : null}
          {block.type === "video" ? <div className="grid w-full gap-3"><input className="admin-input" type="url" value={block.url} placeholder={t("videoUrl")} onChange={(event) => updateBlock(index, { ...block, url: event.target.value })} /><input className="admin-input" value={block.caption ?? ""} placeholder={t("caption")} onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })} /><select className="admin-input" value={block.layout} onChange={(event) => updateBlock(index, { ...block, layout: event.target.value as "default" | "wide" })}><option value="default">{t("defaultLayout")}</option><option value="wide">{t("wideLayout")}</option></select></div> : null}
          {block.type === "list" ? <div className="w-full space-y-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.ordered} onChange={(event) => updateBlock(index, { ...block, ordered: event.target.checked })} />{t("orderedList")}</label><textarea className="admin-input min-h-32 py-3" value={block.items.join("\n")} placeholder={t("listItems")} onChange={(event) => updateBlock(index, { ...block, items: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} /></div> : null}
          {block.type === "callout" ? <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><select className="admin-input" value={block.variant} onChange={(event) => updateBlock(index, { ...block, variant: event.target.value as typeof block.variant })}>{["info", "success", "warning", "important"].map((variant) => <option key={variant} value={variant}>{variant}</option>)}</select><input className="admin-input" value={block.title ?? ""} placeholder={t("calloutTitle")} onChange={(event) => updateBlock(index, { ...block, title: event.target.value })} /></div><RichTextEditor key={`${locale}:${block.id}:callout`} value={block.content} onChange={(content) => updateBlock(index, { ...block, content })} labels={labels as never} /></div> : null}
          {block.type === "quote" ? <div className="grid gap-3"><textarea className="admin-input min-h-28 py-3" value={block.text} placeholder={t("quoteText")} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} /><input className="admin-input" value={block.author ?? ""} placeholder={t("quoteAuthor")} onChange={(event) => updateBlock(index, { ...block, author: event.target.value })} /></div> : null}
          {block.type === "divider" ? <div className="py-5"><hr /></div> : null}</div>
        </article>)}
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-dashed bg-card p-3 sm:flex-row"><select className="admin-input min-w-0 flex-1" aria-label={t("blockType")} value={addType} onChange={(event) => setAddType(event.target.value as PatchNoteEditorBlock["type"])}>{(["paragraph", "heading", "image", "gallery", "video", "list", "callout", "quote", "divider"] as const).map((type) => <option key={type} value={type}>{t(type)}</option>)}</select><button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background" onClick={() => updateTranslation({ blocks: [...translation.blocks, newBlock(addType)] })}><Plus className="size-4" />{t("addBlock")}</button></div>
      </section>
    </div>
    <aside className="space-y-4 xl:sticky xl:top-5">
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-heading text-lg font-semibold">{t("settings")}</h2><div className="mt-4 space-y-4"><label className="space-y-2"><span className="admin-label">{t("slug")}</span><input className="admin-input font-mono text-xs" value={value.slug} onChange={(event) => { setAutoSlug(false); update({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }); }} /></label><label className="space-y-2"><span className="admin-label">{t("version")}</span><input className="admin-input" value={value.version} placeholder={t("versionPlaceholder")} onChange={(event) => update({ version: event.target.value })} /></label><label className="space-y-2"><span className="admin-label">{t("category")}</span><select className="admin-input" value={value.category} onChange={(event) => update({ category: event.target.value as typeof value.category })}>{(["update", "feature", "announcement", "maintenance"] as const).map((category) => <option key={category} value={category}>{categories(category)}</option>)}</select></label><label className="space-y-2"><span className="admin-label">{t("tags")}</span><input className="admin-input" value={value.tags.join(", ")} onChange={(event) => update({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /><span className="admin-help">{t("tagsHelp")}</span></label></div></section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-heading text-lg font-semibold">{t("cover")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("coverHelp")}</p><div className="mt-4 space-y-3">{coverUrl ? <div className="relative aspect-[16/9] overflow-hidden rounded-xl border"><Image src={coverUrl} alt="" fill className="object-cover" unoptimized={coverUrl.startsWith("blob:")} /></div> : null}<div className="flex gap-2"><label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border text-xs font-semibold hover:bg-muted"><ImagePlus className="size-4" />{coverUrl ? t("replaceImage") : t("chooseImage")}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0]; if (file) { const id = value.coverImage?.id ?? uid("cover"); queueFile(id, file); update({ coverImage: { id, alt: value.coverImage?.alt ?? { fr: "", en: "" } } }); } event.target.value = ""; }} /></label>{coverUrl ? <button type="button" className="rounded-lg p-2 text-destructive hover:bg-destructive/8" onClick={() => { if (value.coverImage) removeFile(value.coverImage.id); update({ coverImage: undefined }); }}><Trash2 className="size-4" /></button> : null}</div>{value.coverImage ? <>{(["fr", "en"] as const).map((code) => <label className="space-y-1" key={code}><span className="text-[.65rem] font-semibold tracking-wider text-muted-foreground uppercase">{t("coverAlt")} · {code.toUpperCase()}</span><input className="admin-input" value={value.coverImage?.alt[code] ?? ""} onChange={(event) => update({ coverImage: { ...value.coverImage!, alt: { ...value.coverImage!.alt, [code]: event.target.value } } })} /></label>)}</> : null}</div></section>
      <section className="rounded-2xl border bg-card p-5"><label className="space-y-2"><span className="admin-label">{t("scheduleAt")}</span><input className="admin-input" type="datetime-local" value={value.scheduledAt} onChange={(event) => update({ scheduledAt: event.target.value })} /></label></section>
      {feedback ? <div role="status" className={cn("rounded-xl border px-4 py-3 text-sm", feedback.status === "success" ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300" : "border-destructive/25 bg-destructive/8 text-destructive")}>{feedback.message}</div> : null}
      <div className="grid gap-2"><button type="button" disabled={pending} onClick={() => save("draft")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-card text-sm font-semibold hover:bg-muted disabled:opacity-50"><Save className="size-4" />{pending ? t("saving") : t("saveDraft")}</button><button type="button" disabled={pending} onClick={() => save("publish")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-safir text-sm font-semibold text-white hover:bg-safir/90 disabled:opacity-50"><Send className="size-4" />{t("publish")}</button><button type="button" disabled={pending || !value.scheduledAt} onClick={() => save("schedule")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40">{t("schedule")}</button>{dirty ? <p className="text-center text-[.68rem] text-amber-600 dark:text-amber-400">{t("unsaved")}</p> : null}</div>
    </aside>
  </div>;
}
