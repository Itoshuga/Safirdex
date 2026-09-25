import { BookOpenText } from "lucide-react";
import Link from "next/link";

import { deleteGlossaryAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { formatTimestamp } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import { glossaryRepository } from "@/repositories/glossary.repository";

export default async function GlossaryPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [{ notice }, locale, entries] = await Promise.all([searchParams, getAdminLocale(), glossaryRepository.getAll()]);
  return <><NoticeToast message={notice} /><AdminPageHeader title="Glossary" description="Maintain stable gameplay keys and their localized labels and tooltip definitions." action={{ href: "/admin/glossary/new", label: "Add Entry" }} />{entries.length === 0 ? <EmptyState icon={BookOpenText} title="No glossary entries yet." description="Create reusable terms before inserting them into card descriptions." action={{ href: "/admin/glossary/new", label: "Add Entry" }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>Key</AdminTableHeader><AdminTableHeader>Label</AdminTableHeader><AdminTableHeader>Definition</AdminTableHeader><AdminTableHeader>Updated</AdminTableHeader><AdminTableHeader className="text-right">Actions</AdminTableHeader></tr></AdminTableHead><tbody>{entries.map((entry) => { const translation = getTranslation(entry.translations, locale); return <AdminTableRow key={entry.id}><AdminTableCell><Link href={`/admin/glossary/${entry.id}`} className="font-mono text-xs font-semibold text-safir hover:underline">{entry.key}</Link><p className="mt-0.5 text-[10px] text-muted-foreground">{entry.slug}</p></AdminTableCell><AdminTableCell className="font-medium">{translation?.label ?? "Untitled"}</AdminTableCell><AdminTableCell><p className="max-w-xl truncate text-sm text-muted-foreground">{translation?.definition ?? "—"}</p></AdminTableCell><AdminTableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTimestamp(entry.updatedAt, locale)}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/glossary/${entry.id}`} entityName={translation?.label ?? entry.key} deleteAction={deleteGlossaryAction.bind(null, entry.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>;
}
