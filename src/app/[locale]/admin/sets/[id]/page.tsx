import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { updateSetAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { SetForm } from "@/components/admin/set-form";
import { localizedLabel, toDateInput } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";

export default async function EditSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, locale, set, seasons] = await Promise.all([getTranslations("Admin.sets"), getAdminLocale(), setsRepository.getById(id), seasonsRepository.getAll()]);
  if (!set) notFound();
  const translations = Object.fromEntries(SUPPORTED_LOCALES.map((entry) => [entry, { name: set.translations[entry]?.name ?? "", description: set.translations[entry]?.description ?? "" }]));
  const name = localizedLabel(set.translations, locale);
  return <><AdminBreadcrumbTitle title={name} /><AdminPageHeader eyebrow={t("editEyebrow")} title={name} description={t("editDescription")} /><SetForm action={updateSetAction.bind(null, id)} mode="edit" seasons={seasons.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale) }))} initial={{ id, seasonId: set.seasonId, slug: set.slug, code: set.code ?? "", releaseDate: toDateInput(set.releaseDate), translations }} /></>;
}
