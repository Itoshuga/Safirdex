import type { PatchNoteRichTextNode } from "@/features/patch-notes/types";
import { isSafePatchNoteLink } from "@/features/patch-notes/video";

export function PatchNoteRichText({ nodes }: { nodes: PatchNoteRichTextNode[] }) {
  return nodes.map((node, index) => {
    let content: React.ReactNode = node.text;
    if (node.code) content = <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{content}</code>;
    if (node.italic) content = <em>{content}</em>;
    if (node.bold) content = <strong className="font-semibold text-foreground">{content}</strong>;
    if (node.href && isSafePatchNoteLink(node.href)) {
      const external = /^https?:\/\//i.test(node.href);
      content = <a className="font-medium text-safir underline decoration-safir/35 underline-offset-4 hover:decoration-safir" href={node.href} {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}>{content}</a>;
    }
    return <span key={`${index}-${node.text.slice(0, 12)}`}>{content}{node.break ? <br /> : null}</span>;
  });
}
