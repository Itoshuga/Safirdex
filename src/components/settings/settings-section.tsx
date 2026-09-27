import { cn } from "@/lib/utils";

export function SettingsSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 sm:p-7", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-2 font-heading text-2xl font-semibold">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
