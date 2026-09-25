"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { getStorageDownloadUrl } from "@/lib/firebase/storage";
import { cn } from "@/lib/utils";

export function StorageImage({
  storagePath,
  url,
  alt,
  className,
}: {
  storagePath?: string;
  url?: string;
  alt: string;
  className?: string;
}) {
  const [source, setSource] = useState(url ?? "");

  useEffect(() => {
    if (url) return;
    if (!storagePath) return;
    let active = true;
    getStorageDownloadUrl(storagePath)
      .then((resolved) => active && setSource(resolved))
      .catch(() => active && setSource(""));
    return () => { active = false; };
  }, [storagePath, url]);

  const displayedSource = url ?? source;

  if (!displayedSource) {
    return <div className={cn("grid place-items-center bg-muted text-muted-foreground/55", className)} aria-label={alt}><ImageIcon className="size-4" /></div>;
  }

  return (
    <div
      className={cn("bg-muted bg-contain bg-center bg-no-repeat", className)}
      style={{ backgroundImage: `url(${JSON.stringify(displayedSource)})` }}
      role="img"
      aria-label={alt}
    />
  );
}
