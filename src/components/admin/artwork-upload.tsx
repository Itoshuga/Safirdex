"use client";

import { ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { StorageImage } from "@/components/admin/storage-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CardOrientation } from "@/types/artwork";

export function ArtworkUpload({
  name,
  storagePath,
  sourceUrl,
  orientation,
  onRemove,
  onFileChange,
  compact = false,
}: {
  name: string;
  storagePath?: string;
  sourceUrl?: string;
  orientation: CardOrientation;
  onRemove?: () => void;
  onFileChange?: (hasFile: boolean) => void;
  compact?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function setFile(file?: File) {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    onFileChange?.(true);
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    if (inputRef.current) inputRef.current.value = "";
    onFileChange?.(false);
    onRemove?.();
  }

  const frameClass = orientation === "vertical"
    ? compact ? "aspect-[3/4] w-28" : "aspect-[3/4] w-full max-w-xs"
    : compact ? "aspect-[4/3] w-40" : "aspect-[4/3] w-full max-w-md";

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        className="sr-only"
        id={inputId}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(event) => setFile(event.target.files?.[0])}
      />
      {preview || storagePath || sourceUrl ? (
        <div className="flex flex-col items-start gap-3 sm:flex-row">
          {preview ? (
            <div
              className={cn("rounded-xl border bg-muted bg-contain bg-center bg-no-repeat", frameClass)}
              style={{ backgroundImage: `url(${JSON.stringify(preview)})` }}
              role="img"
              aria-label="Selected artwork preview"
            />
          ) : (
            <StorageImage storagePath={storagePath} url={sourceUrl} alt="Artwork preview" className={cn("rounded-xl border", frameClass)} />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}><RefreshCw /> Replace</Button>
            {onRemove ? <Button type="button" variant="destructive" size="sm" onClick={clear}><Trash2 /> Remove</Button> : null}
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "grid min-h-44 cursor-pointer place-items-center rounded-xl border border-dashed bg-muted/25 p-6 text-center transition hover:border-safir/45 hover:bg-safir/4",
            dragging && "border-safir bg-safir/7",
          )}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (!file || !inputRef.current) return;
            const transfer = new DataTransfer();
            transfer.items.add(file);
            inputRef.current.files = transfer.files;
            setFile(file);
          }}
        >
          <span>
            <span className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-safir/10 text-safir"><UploadCloud className="size-5" /></span>
            <span className="block text-sm font-medium">Drop artwork here or choose a file</span>
            <span className="mt-1 block text-xs text-muted-foreground">JPG, PNG, WebP or AVIF · up to 15 MB</span>
          </span>
        </label>
      )}
      {!preview && !storagePath && !sourceUrl && compact ? (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}><ImagePlus /> Select artwork</Button>
      ) : null}
    </div>
  );
}
