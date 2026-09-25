import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="grid min-h-72 place-items-center rounded-xl border border-dashed bg-card/45 px-6 py-12 text-center">
      <div>
        <span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-safir/10 text-safir"><Icon className="size-5" /></span>
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <p className="mx-auto mt-1.5 mb-5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
        <Link href={action.href} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80">
          <Plus className="size-4" /> {action.label}
        </Link>
      </div>
    </div>
  );
}
