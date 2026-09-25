import Image from "next/image";

import { cn } from "@/lib/utils";

export function SafirLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/safir-logo.webp"
      alt=""
      width={600}
      height={600}
      className={cn(
        "shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.04] dark:invert",
        className,
      )}
    />
  );
}
