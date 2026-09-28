"use client";

import { LoaderCircle, RotateCw } from "lucide-react";
import { useState } from "react";

export function MaintenanceRetryButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_12px_35px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:pointer-events-none disabled:opacity-70"
      onClick={() => {
        setPending(true);
        window.location.reload();
      }}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <RotateCw className="size-4" aria-hidden="true" />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}
