import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Pagination({ page, pages, makeHref, total, pageSize }: { page: number; pages: number; total: number; pageSize: number; makeHref: (page: number) => string }) {
  if (pages <= 1) return <p className="mt-4 text-xs text-muted-foreground">{total} item{total === 1 ? "" : "s"}</p>;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm">
      <p className="text-xs text-muted-foreground">{first}–{last} of {total}</p>
      <div className="flex items-center gap-2">
        <Link aria-disabled={page <= 1} className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium aria-disabled:pointer-events-none aria-disabled:opacity-40" href={makeHref(Math.max(1, page - 1))}><ChevronLeft className="size-3.5" /> Previous</Link>
        <span className="text-xs text-muted-foreground">Page {page} / {pages}</span>
        <Link aria-disabled={page >= pages} className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium aria-disabled:pointer-events-none aria-disabled:opacity-40" href={makeHref(Math.min(pages, page + 1))}>Next <ChevronRight className="size-3.5" /></Link>
      </div>
    </div>
  );
}
