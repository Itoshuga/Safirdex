"use client";

import { Bold, Code2, Italic, Link2 } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import type { PatchNoteRichTextNode } from "@/features/patch-notes/types";
import { isSafePatchNoteLink } from "@/features/patch-notes/video";

type RichTextMarks = Omit<PatchNoteRichTextNode, "text" | "break">;

const BLOCK_TAGS = new Set(["blockquote", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "p", "pre"]);

function sameMarks(left: PatchNoteRichTextNode, right: PatchNoteRichTextNode) {
  return Boolean(left.bold) === Boolean(right.bold)
    && Boolean(left.italic) === Boolean(right.italic)
    && Boolean(left.code) === Boolean(right.code)
    && (left.href ?? "") === (right.href ?? "");
}

function normalizeNodes(nodes: PatchNoteRichTextNode[]) {
  const output: PatchNoteRichTextNode[] = [];

  for (const node of nodes) {
    const href = node.href && isSafePatchNoteLink(node.href) ? node.href : undefined;
    const next: PatchNoteRichTextNode = {
      text: node.text,
      ...(node.bold ? { bold: true } : {}),
      ...(node.italic ? { italic: true } : {}),
      ...(node.code ? { code: true } : {}),
      ...(href ? { href } : {}),
      ...(node.break ? { break: true } : {}),
    };

    if (!next.text && !next.break) continue;
    const previous = output.at(-1);
    if (previous && !previous.break && !next.break && sameMarks(previous, next)) {
      previous.text += next.text;
    } else {
      output.push(next);
    }
  }

  return output.slice(0, 500);
}

function nodesFrom(element: HTMLElement) {
  const output: PatchNoteRichTextNode[] = [];
  const pushBreak = () => output.push({ text: "", break: true });
  const pushStructuralBreak = () => {
    if (!output.at(-1)?.break) output.push({ text: "", break: true });
  };

  function visit(node: Node, marks: RichTextMarks = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) output.push({ text: node.textContent, ...marks });
      return;
    }
    if (!(node instanceof HTMLElement)) return;

    const tag = node.tagName.toLowerCase();
    if (tag === "br") {
      pushBreak();
      return;
    }

    const href = tag === "a" ? node.getAttribute("href") : null;
    const nextMarks: RichTextMarks = {
      ...marks,
      ...(["b", "strong"].includes(tag) ? { bold: true } : {}),
      ...(["i", "em"].includes(tag) ? { italic: true } : {}),
      ...(["code", "pre"].includes(tag) ? { code: true } : {}),
      ...(href && isSafePatchNoteLink(href) ? { href } : {}),
    };

    if (BLOCK_TAGS.has(tag) && node.previousSibling && output.length > 0) pushStructuralBreak();
    node.childNodes.forEach((child) => visit(child, nextMarks));
    if (BLOCK_TAGS.has(tag) && node.nextSibling) pushStructuralBreak();
  }

  element.childNodes.forEach((node) => visit(node));
  return normalizeNodes(output);
}

function appendRichTextNode(parent: DocumentFragment, node: PatchNoteRichTextNode) {
  if (node.text) {
    let content: Node = document.createTextNode(node.text);

    if (node.code) {
      const code = document.createElement("code");
      code.className = "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]";
      code.append(content);
      content = code;
    }
    if (node.italic) {
      const italic = document.createElement("em");
      italic.append(content);
      content = italic;
    }
    if (node.bold) {
      const strong = document.createElement("strong");
      strong.className = "font-semibold text-foreground";
      strong.append(content);
      content = strong;
    }
    if (node.href && isSafePatchNoteLink(node.href)) {
      const link = document.createElement("a");
      link.href = node.href;
      link.className = "font-medium text-safir underline decoration-safir/35 underline-offset-4";
      link.append(content);
      content = link;
    }

    parent.append(content);
  }

  if (node.break) parent.append(document.createElement("br"));
}

function renderNodes(element: HTMLElement, nodes: PatchNoteRichTextNode[]) {
  const fragment = document.createDocumentFragment();
  nodes.forEach((node) => appendRichTextNode(fragment, node));
  element.replaceChildren(fragment);
}

function signature(nodes: PatchNoteRichTextNode[]) {
  return JSON.stringify(normalizeNodes(nodes));
}

function applyInlineCode(element: HTMLElement) {
  element.focus();
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return false;

  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return false;

  const code = document.createElement("code");
  code.append(range.extractContents());
  range.insertNode(code);
  selection.removeAllRanges();
  const nextRange = document.createRange();
  nextRange.selectNodeContents(code);
  selection.addRange(nextRange);
  return true;
}

export function RichTextEditor({ value, onChange, labels }: { value: PatchNoteRichTextNode[]; onChange: (value: PatchNoteRichTextNode[]) => void; labels: { richText: string; bold: string; italic: string; code: string; link: string; linkPrompt: string } }) {
  const editor = useRef<HTMLDivElement>(null);
  const initialValue = useRef(value);
  const composing = useRef(false);
  const domSignature = useRef<string | null>(null);

  useLayoutEffect(() => {
    const element = editor.current;
    if (!element) return;
    renderNodes(element, initialValue.current);
    domSignature.current = signature(initialValue.current);
  }, []);

  function commit(element: HTMLElement) {
    const next = nodesFrom(element);
    const nextSignature = signature(next);
    if (domSignature.current === nextSignature) return;
    domSignature.current = nextSignature;
    onChange(next);
  }

  function command(name: string, commandValue?: string) {
    const element = editor.current;
    if (!element) return;
    element.focus();
    document.execCommand(name, false, commandValue);
    commit(element);
  }

  function codeCommand() {
    const element = editor.current;
    if (element && applyInlineCode(element)) commit(element);
  }

  function linkCommand() {
    const element = editor.current;
    const selection = window.getSelection();
    if (!element || !selection?.rangeCount) return;
    const selectedRange = selection.getRangeAt(0);
    if (selectedRange.collapsed || !element.contains(selectedRange.commonAncestorContainer)) return;

    const savedRange = selectedRange.cloneRange();
    const href = window.prompt(labels.linkPrompt);
    if (!href || !isSafePatchNoteLink(href)) return;

    element.focus();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    document.execCommand("createLink", false, href);
    commit(element);
  }

  return <div className="w-full overflow-hidden rounded-xl border bg-background focus-within:border-safir/45 focus-within:ring-2 focus-within:ring-safir/10">
    <div className="flex gap-1 border-b bg-muted/35 p-1.5">
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.bold} aria-label={labels.bold} onMouseDown={(event) => { event.preventDefault(); command("bold"); }}><Bold className="size-3.5" /></button>
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.italic} aria-label={labels.italic} onMouseDown={(event) => { event.preventDefault(); command("italic"); }}><Italic className="size-3.5" /></button>
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.code} aria-label={labels.code} onMouseDown={(event) => { event.preventDefault(); codeCommand(); }}><Code2 className="size-3.5" /></button>
      <button className="rounded-md p-2 hover:bg-background" type="button" title={labels.link} aria-label={labels.link} onMouseDown={(event) => { event.preventDefault(); linkCommand(); }}><Link2 className="size-3.5" /></button>
    </div>
    <div
      ref={editor}
      role="textbox"
      aria-label={labels.richText}
      aria-multiline="true"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={(event) => { composing.current = false; commit(event.currentTarget); }}
      onInput={(event) => { if (!composing.current) commit(event.currentTarget); }}
      onBlur={(event) => commit(event.currentTarget)}
      onPaste={(event) => {
        event.preventDefault();
        command("insertText", event.clipboardData.getData("text/plain"));
      }}
      className="min-h-28 px-3.5 py-3 text-sm leading-7 outline-none"
    />
  </div>;
}
