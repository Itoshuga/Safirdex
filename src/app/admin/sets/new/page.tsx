import { createSetAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SetForm } from "@/components/admin/set-form";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { seasonsRepository } from "@/repositories/seasons.repository";

export default async function NewSetPage() {
  const [locale, seasons] = await Promise.all([getAdminLocale(), seasonsRepository.getAll()]);
  return <><AdminPageHeader eyebrow="Sets / New" title="Create Set" description="Attach this release to one season and localize its public identity." /><SetForm action={createSetAction} mode="create" seasons={seasons.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale) }))} /></>;
}
