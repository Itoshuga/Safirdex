import Image from "next/image";

import { cn } from "@/lib/utils";

export function ProfileAvatar({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border-4 border-background bg-safir text-lg font-semibold text-safir-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      {src ? (
        <Image src={src} alt="" fill sizes="128px" className="object-cover" />
      ) : (
        name.trim().slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

