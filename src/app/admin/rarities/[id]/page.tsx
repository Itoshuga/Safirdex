import { notFound } from "next/navigation";

import { updateRarityAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { VisualEntityForm } from "@/components/admin/visual-entity-form";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { raritiesRepository } from "@/repositories/rarities.repository";

export default async function EditRarityPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [locale, rarity] = await Promise.all([getAdminLocale(), raritiesRepository.getById(id)]); if (!rarity) notFound(); const translations = Object.fromEntries(SUPPORTED_LOCALES.map((entry) => [entry, { name: rarity.translations[entry]?.name ?? "", description: rarity.translations[entry]?.description ?? "" }])); const name = localizedLabel(rarity.translations, locale); return <><AdminBreadcrumbTitle title={name} /><AdminPageHeader eyebrow="Edit Rarity" title={name} description="Preview visual changes before saving them to the catalogue." /><VisualEntityForm action={updateRarityAction.bind(null, id)} mode="edit" kind="rarity" initial={{ id, slug: rarity.slug, order: rarity.order, translations, visual: rarity.visual }} /></>; }
