"use client";

import { Bold, Code2, Italic, Link2 } from "lucide-react";
import { useRef } from "react";

import { PatchNoteRichText } from "@/components/patch-notes/rich-text";
import type { PatchNoteRichTextNode } from "@/features/patch-notes/types";

function nodesFrom(element: HTMLElement) {
  const output: PatchNoteRichTextNode[] = [];
  function visit(node: Node, marks: Omit<PatchNoteRichTextNode, "text"> = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) output.push({ text: node.textContent, ...marks });
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    if (tag === "br") {
      output.push({ text: "", break: true, ...marks });
      return;
    }
    const next = {
      ...marks,
      ...(["b", "strong"].includes(tag) ? { bold: true } : {}),
      ...(["i", "em"].includes(tag) ? { italic: true } : {}),
      ...(["code", "pre"].includes(tag) ? { code: true } : {}),
      ...(tag === "a" && node.getAttribute("href") ? { href: node.getAttribute("href")! } : {}),
    };
    node.childNodes.forEach((child) => visit(child, next));
    if (["div", "p"].includes(tag) && node.nextSibling) output.push({ text: "", break: true });
  }
  element.childNodes.forEach((node) => visit(node));
  return output.slice(0, 500);
}

export function RichTextEditor({ value, onChange, labels }: { value: PatchNoteRichTextNode[]; onChange: (value: PatchNoteRichTextNode[]) => void; labels: { richText: string; bold: string; italic: string; code: string; link: string; linkPrompt: string } }) {
  const editor = useRef<HTMLDivElement>(null);
  function command(name: string, commandValue?: string) {
    editor.current?.focus();
    document.execCommand(name, false, commandValue);
  }
  return <div className="w-full overflow-hidden rounded-xl border bg-background focus-within:border-safir/45 focus-within:ring-2 focus-within:ring-safir/10">
    <div className="flex gap-1 border-b bg-muted/35 p-1.5">
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.bold} aria-label={labels.bold} onMouseDown={(event) => { event.preventDefault(); command("bold"); }}><Bold className="size-3.5" /></button>
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.italic} aria-label={labels.italic} onMouseDown={(event) => { event.preventDefault(); command("italic"); }}><Italic className="size-3.5" /></button>
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.code} aria-label={labels.code} onMouseDown={(event) => { event.preventDefault(); command("formatBlock", "pre"); }}><Code2 className="size-3.5" /></button>
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.link} aria-label={labels.link} onMouseDown={(event) => { event.preventDefault(); const href = window.prompt(labels.linkPrompt); if (href) command("createLink", href); }}><Link2 className="size-3.5" /></button>
    </div>
    <div ref={editor} role="textbox" aria-label={labels.richText} aria-multiline="true" contentEditable suppressContentEditableWarning onBlur={(event) => onChange(nodesFrom(event.currentTarget))} className="min-h-28 px-3.5 py-3 text-sm leading-7 outline-none"><PatchNoteRichText nodes={value} /></div>
  </div>;
}
