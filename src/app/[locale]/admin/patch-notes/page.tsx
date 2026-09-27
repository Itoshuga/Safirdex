import { Newspaper } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PatchNoteRowActions } from "@/components/patch-notes/patch-note-row-actions";
import { Badge } from "@/components/ui/badge";
import { deletePatchNoteAction, duplicatePatchNoteAction, publishPatchNoteAction, unpublishPatchNoteAction } from "@/features/patch-notes/server/actions";
import { formatTimestamp } from "@/features/admin/presentation";
import { Link } from "@/i18n/navigation";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { patchNotesRepository } from "@/repositories/patch-notes.repository";

export default async function AdminPatchNotesPage() {
  const [t, status, category, locale, notes] = await Promise.all([getTranslations("PatchNotes.admin.list"), getTranslations("PatchNotes.status"), getTranslations("PatchNotes.category"), getAdminLocale(), patchNotesRepository.listAdmin()]);
  return <>
    <AdminPageHeader title={t("title")} description={t("description")} action={{ href: "/admin/patch-notes/new", label: t("add") }} />
    {notes.length === 0 ? <EmptyState icon={Newspaper} title={t("emptyTitle")} description={t("emptyDescription")} action={{ href: "/admin/patch-notes/new", label: t("add") }} /> : <>
      <div className="hidden md:block"><AdminTable><AdminTableHead><tr><AdminTableHeader>{t("article")}</AdminTableHeader><AdminTableHeader>{t("category")}</AdminTableHeader><AdminTableHeader>{t("status")}</AdminTableHeader><AdminTableHeader>{t("publication")}</AdminTableHeader><AdminTableHeader>{t("updated")}</AdminTableHeader><AdminTableHeader className="text-right">{t("actions")}</AdminTableHeader></tr></AdminTableHead><tbody>{notes.map((note) => {
        const translation = getTranslation(note.translations, locale) ?? note.translations.fr;
        const published = note.status === "published";
        return <AdminTableRow key={note.id}>
          <AdminTableCell><div className="flex items-center gap-3">{note.coverImage ? <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted"><Image src={note.coverImage.url} alt="" fill className="object-cover" sizes="80px" /></div> : <div className="grid h-12 w-20 shrink-0 place-items-center rounded-lg border bg-muted"><Newspaper className="size-4 text-muted-foreground" /></div>}<div className="min-w-0"><Link href={`/admin/patch-notes/${note.id}`} className="block max-w-80 truncate font-medium hover:text-safir">{translation.title || note.slug}</Link><p className="mt-0.5 max-w-80 truncate text-xs text-muted-foreground">{note.version ? `${note.version} · ` : ""}{note.slug}</p></div></div></AdminTableCell>
          <AdminTableCell><Badge variant="outline">{category(note.category)}</Badge></AdminTableCell>
          <AdminTableCell><Badge variant={note.status === "published" ? "default" : "secondary"}>{status(note.status)}</Badge></AdminTableCell>
          <AdminTableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTimestamp(note.visibleAt ?? note.publishedAt, locale, true)}</AdminTableCell>
          <AdminTableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTimestamp(note.updatedAt, locale, true)}</AdminTableCell>
          <AdminTableCell><PatchNoteRowActions id={note.id} slug={note.slug} title={translation.title || note.slug} published={published} canUnpublish={note.status !== "draft"} deleteAction={deletePatchNoteAction.bind(null, note.id)} duplicateAction={duplicatePatchNoteAction.bind(null, note.id)} publishAction={publishPatchNoteAction.bind(null, note.id)} unpublishAction={unpublishPatchNoteAction.bind(null, note.id)} /></AdminTableCell>
        </AdminTableRow>;
      })}</tbody></AdminTable></div>
      <div className="space-y-3 md:hidden">{notes.map((note) => { const translation = getTranslation(note.translations, locale) ?? note.translations.fr; return <article key={note.id} className="rounded-2xl border bg-card p-4"><div className="flex gap-3">{note.coverImage ? <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border"><Image src={note.coverImage.url} alt="" fill className="object-cover" sizes="112px" /></div> : null}<div className="min-w-0 flex-1"><Link href={`/admin/patch-notes/${note.id}`} className="line-clamp-2 font-heading text-lg font-semibold">{translation.title || note.slug}</Link><div className="mt-2 flex gap-2"><Badge variant="outline">{category(note.category)}</Badge><Badge variant="secondary">{status(note.status)}</Badge></div></div></div><div className="mt-3 flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">{formatTimestamp(note.updatedAt, locale)}</span><PatchNoteRowActions id={note.id} slug={note.slug} title={translation.title || note.slug} published={note.status === "published"} canUnpublish={note.status !== "draft"} deleteAction={deletePatchNoteAction.bind(null, note.id)} duplicateAction={duplicatePatchNoteAction.bind(null, note.id)} publishAction={publishPatchNoteAction.bind(null, note.id)} unpublishAction={unpublishPatchNoteAction.bind(null, note.id)} /></div></article>; })}</div>
    </>}
  </>;
}
