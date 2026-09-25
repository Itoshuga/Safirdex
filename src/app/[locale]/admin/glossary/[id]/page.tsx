import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { updateGlossaryAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { GlossaryForm } from "@/components/admin/glossary-form";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { glossaryRepository } from "@/repositories/glossary.repository";

export default async function EditGlossaryPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [t, locale, entry] = await Promise.all([getTranslations("Admin.glossary"), getAdminLocale(), glossaryRepository.getById(id)]); if (!entry) notFound(); const translations = Object.fromEntries(SUPPORTED_LOCALES.map((localeKey) => [localeKey, { label: entry.translations[localeKey]?.label ?? "", definition: entry.translations[localeKey]?.definition ?? "" }])); const name = getTranslation(entry.translations, locale)?.label ?? entry.key; return <><AdminBreadcrumbTitle title={name} /><AdminPageHeader eyebrow={t("editEyebrow")} title={name} description={t("editDescription")} /><GlossaryForm action={updateGlossaryAction.bind(null, id)} mode="edit" initial={{ id, key: entry.key, slug: entry.slug, translations }} /></>; }
