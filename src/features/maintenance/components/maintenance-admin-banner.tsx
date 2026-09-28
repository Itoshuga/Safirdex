"use client";

import { AlertTriangle, LoaderCircle, Power, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setMaintenanceEnabledAction } from "@/features/maintenance/server/actions";
import { Link, useRouter } from "@/i18n/navigation";

export function MaintenanceAdminBanner({ sticky = true }: { sticky?: boolean }) {
  const t = useTranslations("Maintenance.adminBanner");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <aside
      className={`${sticky ? "sticky top-0" : "relative"} z-[70] border-b border-amber-400/20 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--ember)_16%,var(--background)),var(--background)_45%,color-mix(in_oklch,var(--safir)_8%,var(--background)))] px-4 py-2.5 shadow-sm`}
      aria-label={t("title")}
    >
      <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-x-4 gap-y-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-300">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{t("title")}</p>
          <p className="text-[0.68rem] text-muted-foreground">{t("description")}</p>
        </div>
        {failed ? (
          <p className="text-xs font-medium text-destructive" role="alert">
            {t("error")}
          </p>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/system" />}
          >
            <Settings aria-hidden="true" />
            <span className="hidden sm:inline">{t("system")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setFailed(false);
              startTransition(async () => {
                const result = await setMaintenanceEnabledAction(false);
                if (result.status === "error") {
                  setFailed(true);
                  return;
                }
                router.refresh();
              });
            }}
          >
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Power aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {pending ? t("disabling") : t("disable")}
            </span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
