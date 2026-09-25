import { createSetAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SetForm } from "@/components/admin/set-form";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { getTranslations } from "next-intl/server";

export default async function NewSetPage() {
  const [t, locale, seasons] = await Promise.all([getTranslations("Admin.sets"), getAdminLocale(), seasonsRepository.getAll()]);
  return <><AdminPageHeader eyebrow={t("createEyebrow")} title={t("createTitle")} description={t("createDescription")} /><SetForm action={createSetAction} mode="create" seasons={seasons.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale) }))} /></>;
}
