import { createSeasonAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SeasonForm } from "@/components/admin/season-form";

export default function NewSeasonPage() {
  return <><AdminPageHeader eyebrow="Seasons / New" title="Create Season" description="Add a localized season and configure its public visibility." /><SeasonForm action={createSeasonAction} mode="create" /></>;
}
