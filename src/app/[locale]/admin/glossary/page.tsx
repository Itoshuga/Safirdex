import { BookOpenText } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { deleteGlossaryAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { formatTimestamp } from "@/features/admin/presentation";
import { Link } from "@/i18n/navigation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import { glossaryRepository } from "@/repositories/glossary.repository";

export default async function GlossaryPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [t, entities, table, states, { notice }, locale, entries] = await Promise.all([getTranslations("Admin.glossary"), getTranslations("Admin.entities"), getTranslations("Admin.table"), getTranslations("Common.states"), searchParams, getAdminLocale(), glossaryRepository.getAll()]);
  return <><NoticeToast message={notice} /><AdminPageHeader title={entities("glossary")} description={t("description")} action={{ href: "/admin/glossary/new", label: t("add") }} />{entries.length === 0 ? <EmptyState icon={BookOpenText} title={t("emptyTitle")} description={t("emptyDescription")} action={{ href: "/admin/glossary/new", label: t("add") }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>{table("labelKey")}</AdminTableHeader><AdminTableHeader>{table("name")}</AdminTableHeader><AdminTableHeader>{table("definition")}</AdminTableHeader><AdminTableHeader>{table("updated")}</AdminTableHeader><AdminTableHeader className="text-right">{table("actions")}</AdminTableHeader></tr></AdminTableHead><tbody>{entries.map((entry) => { const translation = getTranslation(entry.translations, locale); return <AdminTableRow key={entry.id}><AdminTableCell><Link href={`/admin/glossary/${entry.id}`} className="font-mono text-xs font-semibold text-safir hover:underline">{entry.key}</Link><p className="mt-0.5 text-[10px] text-muted-foreground">{entry.slug}</p></AdminTableCell><AdminTableCell className="font-medium">{translation?.label ?? states("untitled")}</AdminTableCell><AdminTableCell><p className="max-w-xl truncate text-sm text-muted-foreground">{translation?.definition ?? "—"}</p></AdminTableCell><AdminTableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTimestamp(entry.updatedAt, locale)}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/glossary/${entry.id}`} entityName={translation?.label ?? entry.key} deleteAction={deleteGlossaryAction.bind(null, entry.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>;
}
