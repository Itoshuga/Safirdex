import { cn } from "@/lib/utils";

export function AdminTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b bg-muted/45 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{children}</thead>;
}

export function AdminTableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn("border-b transition-colors last:border-0 hover:bg-muted/35", className)}>{children}</tr>;
}

export function AdminTableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("h-11 px-4 font-semibold whitespace-nowrap", className)} scope="col">{children}</th>;
}

export function AdminTableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
