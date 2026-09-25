import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FormActions({ cancelHref, pending, label = "Save" }: { cancelHref: string; pending: boolean; label?: string }) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-xl border bg-background/92 p-3 shadow-xl shadow-black/5 backdrop-blur-xl">
      <Button nativeButton={false} variant="ghost" render={<Link href={cancelHref} />}>
        Cancel
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        {pending ? "Saving…" : label}
      </Button>
    </div>
  );
}
