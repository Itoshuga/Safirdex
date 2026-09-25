import { Boxes } from "lucide-react";
import Link from "next/link";

import { deleteSetAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { formatTimestamp, localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardsRepository } from "@/repositories/cards.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";

export default async function SetsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [{ notice }, locale, sets, seasons, cards] = await Promise.all([searchParams, getAdminLocale(), setsRepository.getAll(), seasonsRepository.getAll(), cardsRepository.getAll()]);
  const seasonNames = new Map(seasons.map((entry) => [entry.id, localizedLabel(entry.translations, locale)]));
  const counts = new Map<string, number>(); cards.forEach((card) => card.setId && counts.set(card.setId, (counts.get(card.setId) ?? 0) + 1));
  return <><NoticeToast message={notice} /><AdminPageHeader title="Sets" description="Group cards into releases that belong to a specific season." action={{ href: "/admin/sets/new", label: "Add Set" }} />{sets.length === 0 ? <EmptyState icon={Boxes} title="No sets yet." description="Create a set within one of your existing seasons." action={{ href: "/admin/sets/new", label: "Add Set" }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>Name</AdminTableHeader><AdminTableHeader>Code</AdminTableHeader><AdminTableHeader>Season</AdminTableHeader><AdminTableHeader>Release date</AdminTableHeader><AdminTableHeader>Cards</AdminTableHeader><AdminTableHeader>Updated</AdminTableHeader><AdminTableHeader className="text-right">Actions</AdminTableHeader></tr></AdminTableHead><tbody>{sets.map((set) => { const name = localizedLabel(set.translations, locale); return <AdminTableRow key={set.id}><AdminTableCell><Link href={`/admin/sets/${set.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link><p className="text-xs text-muted-foreground">{set.slug}</p></AdminTableCell><AdminTableCell className="font-mono text-xs">{set.code ?? "—"}</AdminTableCell><AdminTableCell>{seasonNames.get(set.seasonId) ?? "Unknown"}</AdminTableCell><AdminTableCell>{formatTimestamp(set.releaseDate, locale)}</AdminTableCell><AdminTableCell>{counts.get(set.id) ?? 0}</AdminTableCell><AdminTableCell className="text-xs text-muted-foreground">{formatTimestamp(set.updatedAt, locale)}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/sets/${set.id}`} entityName={name} deleteAction={deleteSetAction.bind(null, set.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>;
}
