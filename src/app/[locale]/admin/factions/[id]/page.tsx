import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { updateFactionAction } from "@/app/[locale]/admin/actions";
import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { factionsRepository } from "@/repositories/factions.repository";

export default async function EditFactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, locale, faction] = await Promise.all([getTranslations("Admin.factions"), getAdminLocale(), factionsRepository.getById(id)]);
  if (!faction) notFound();
  const translations = Object.fromEntries(SUPPORTED_LOCALES.map((entry) => [entry, { name: faction.translations[entry]?.name ?? "", description: faction.translations[entry]?.description ?? "" }]));
  const name = localizedLabel(faction.translations, locale);
  return <><AdminBreadcrumbTitle title={name} /><AdminPageHeader eyebrow={t("editEyebrow")} title={name} description={t("editDescription")} /><VisualEntityForm action={updateFactionAction.bind(null, id)} mode="edit" kind="faction" initial={{ id, slug: faction.slug, translations, visual: faction.visual }} /></>;
}
