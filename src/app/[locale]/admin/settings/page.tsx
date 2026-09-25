import { Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminSettingsPage() {
  const t = await getTranslations("Admin.settings");
  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <div className="grid min-h-72 place-items-center rounded-xl border border-dashed bg-card/45 text-center"><div><Settings className="mx-auto mb-3 size-8 text-safir" /><h2 className="font-heading text-xl font-semibold">{t("emptyTitle")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p></div></div>
    </>
  );
}
