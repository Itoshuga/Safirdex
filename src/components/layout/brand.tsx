import Link from "next/link";

import { cn } from "@/lib/utils";

interface BrandProps {
  compact?: boolean;
  className?: string;
}

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
      aria-label="Safir Codex — Home"
    >
      <span
        aria-hidden="true"
        className="relative grid size-9 place-items-center border border-safir/45 bg-safir/10 transition-colors group-hover:bg-safir/15"
      >
        <span className="absolute size-4 rotate-45 border border-safir/80" />
        <span className="size-1.5 rotate-45 bg-safir" />
      </span>
      <span className={cn("leading-none", compact && "hidden sm:block")}>
        <span className="block font-heading text-xl font-semibold tracking-[0.18em]">
          SAFIR
        </span>
        <span className="mt-1 block text-[0.57rem] font-semibold tracking-[0.42em] text-muted-foreground">
          CODEX
        </span>
      </span>
    </Link>
  );
}
