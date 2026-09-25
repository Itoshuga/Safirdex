import { notFound } from "next/navigation";

import { updateSeasonAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { SeasonForm } from "@/components/admin/season-form";
import { formatTimestamp, localizedLabel, toDateInput } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { seasonsRepository } from "@/repositories/seasons.repository";

export default async function EditSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [season, locale] = await Promise.all([seasonsRepository.getById(id), getAdminLocale()]);
  if (!season) notFound();
  const translations = Object.fromEntries(SUPPORTED_LOCALES.map((entry) => [entry, { name: season.translations[entry]?.name ?? "", description: season.translations[entry]?.description ?? "" }]));
  const name = localizedLabel(season.translations, locale);
  return <><AdminBreadcrumbTitle title={name} /><AdminPageHeader eyebrow="Edit Season" title={name} description="Changes are validated server-side before Firestore is updated." /><SeasonForm action={updateSeasonAction.bind(null, id)} mode="edit" initial={{ id, number: season.number, slug: season.slug, releaseDate: toDateInput(season.releaseDate), isActive: season.isActive, isFeatured: season.isFeatured, artwork: season.artwork, translations, createdAt: formatTimestamp(season.createdAt, locale, true), updatedAt: formatTimestamp(season.updatedAt, locale, true) }} /></>;
}
