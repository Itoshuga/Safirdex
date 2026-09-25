import { createSeasonAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeasonForm } from "@/components/admin/season-form";
import { getTranslations } from "next-intl/server";

export default async function NewSeasonPage() {
  const t = await getTranslations("Admin.seasons");
  return <><AdminPageHeader eyebrow={t("createEyebrow")} title={t("createTitle")} description={t("createDescription")} /><SeasonForm action={createSeasonAction} mode="create" /></>;
}
