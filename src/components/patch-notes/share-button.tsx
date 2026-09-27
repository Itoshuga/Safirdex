"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function PatchNoteShareButton({ label }: { label: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (navigator.share) {
      await navigator.share({ title: document.title, url: window.location.href }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }).catch(() => undefined);
  }
  return <button type="button" onClick={share} className="inline-flex h-9 items-center gap-2 rounded-full border bg-background px-4 text-xs font-semibold transition hover:border-safir/35 hover:text-safir">{copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}{label}</button>;
}
