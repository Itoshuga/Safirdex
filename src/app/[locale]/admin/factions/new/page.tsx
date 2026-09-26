import { getTranslations } from "next-intl/server";

import { createFactionAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";

export default async function NewFactionPage() {
  const t = await getTranslations("Admin.factions");
  return <><AdminPageHeader eyebrow={t("createEyebrow")} title={t("createTitle")} description={t("createDescription")} /><VisualEntityForm action={createFactionAction} mode="create" kind="faction" /></>;
}
