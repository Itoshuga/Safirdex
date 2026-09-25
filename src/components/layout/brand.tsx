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
      aria-label="Safirdex — Home"
    >
      <span
        aria-hidden="true"
        className="relative block size-9 overflow-hidden bg-foreground"
      >
        <span className="absolute -right-2.5 -bottom-2.5 size-7 rotate-45 bg-safir transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
      <span className={cn("leading-none", compact && "hidden sm:block")}>
        <span className="block font-heading text-lg font-semibold tracking-[-0.03em]">Safirdex</span>
        <span className="mt-1 block text-[0.58rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">Card index</span>
      </span>
    </Link>
  );
}
