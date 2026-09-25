import { notFound } from "next/navigation";

import { updateTypeAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { cardTypesRepository } from "@/repositories/card-types.repository";

export default async function EditTypePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [locale, type] = await Promise.all([getAdminLocale(), cardTypesRepository.getById(id)]); if (!type) notFound(); const translations = Object.fromEntries(SUPPORTED_LOCALES.map((entry) => [entry, { name: type.translations[entry]?.name ?? "", description: type.translations[entry]?.description ?? "" }])); const name = localizedLabel(type.translations, locale); return <><AdminBreadcrumbTitle title={name} /><AdminPageHeader eyebrow="Edit Type" title={name} description="Update this type across every card that references it." /><VisualEntityForm action={updateTypeAction.bind(null, id)} mode="edit" kind="type" initial={{ id, slug: type.slug, translations, visual: type.visual }} /></>; }
