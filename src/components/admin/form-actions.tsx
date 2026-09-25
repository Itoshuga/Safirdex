import { LoaderCircle, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function FormActions({ cancelHref, pending, label }: { cancelHref: string; pending: boolean; label?: string }) {
  const t = useTranslations("Common.actions");
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-xl border bg-background/92 p-3 shadow-xl shadow-black/5 backdrop-blur-xl">
      <Button nativeButton={false} variant="ghost" render={<Link href={cancelHref} />}>
        {t("cancel")}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
        {pending ? t("saving") : label ?? t("save")}
      </Button>
    </div>
  );
}
