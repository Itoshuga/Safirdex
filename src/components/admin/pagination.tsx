import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Pagination({ page, pages, makeHref, total, pageSize }: { page: number; pages: number; total: number; pageSize: number; makeHref: (page: number) => string }) {
  const t = useTranslations("Common.pagination");
  const actions = useTranslations("Common.actions");
  if (pages <= 1) return <p className="mt-4 text-xs text-muted-foreground">{t("items", { count: total })}</p>;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm">
      <p className="text-xs text-muted-foreground">{t("range", { first, last, total })}</p>
      <div className="flex items-center gap-2">
        <Link aria-disabled={page <= 1} className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium aria-disabled:pointer-events-none aria-disabled:opacity-40" href={makeHref(Math.max(1, page - 1))}><ChevronLeft className="size-3.5" /> {actions("previous")}</Link>
        <span className="text-xs text-muted-foreground">{t("page", { page, pages })}</span>
        <Link aria-disabled={page >= pages} className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium aria-disabled:pointer-events-none aria-disabled:opacity-40" href={makeHref(Math.min(pages, page + 1))}>{actions("next")} <ChevronRight className="size-3.5" /></Link>
      </div>
    </div>
  );
}
