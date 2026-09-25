import Link from "next/link";

import { SafirLogo } from "@/components/layout/safir-logo";
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
      <SafirLogo className="size-9" />
      <span className={cn("leading-none", compact && "hidden sm:block")}>
        <span className="block font-heading text-lg font-semibold tracking-[-0.03em]">Safirdex</span>
        <span className="mt-1 block text-[0.58rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">Card index</span>
      </span>
    </Link>
  );
}
