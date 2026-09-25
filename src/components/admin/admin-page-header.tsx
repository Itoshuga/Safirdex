import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function AdminPageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-safir uppercase"><span className="size-1.5 bg-safir" />{eyebrow}</p> : null}
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
        >
          <Plus className="size-4" />
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
