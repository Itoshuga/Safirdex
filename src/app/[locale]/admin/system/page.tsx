import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MaintenanceSettingsForm } from "@/features/maintenance/components/maintenance-settings-form";
import { getMaintenanceConfig } from "@/features/maintenance/server/maintenance-service";

export default async function AdminSystemPage() {
  const [t, maintenance] = await Promise.all([
    getTranslations("Admin.system"),
    getMaintenanceConfig(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <MaintenanceSettingsForm initialConfig={maintenance} />
    </>
  );
}
