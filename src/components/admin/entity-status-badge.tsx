import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EntityStatusBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        active
          ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
          : "text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground/45")} />
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
