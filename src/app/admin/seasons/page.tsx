import { Sparkles } from "lucide-react";
import Link from "next/link";

import { deleteSeasonAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import { NoticeToast } from "@/components/admin/notice-toast";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp, localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardsRepository } from "@/repositories/cards.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";

export default async function SeasonsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [{ notice }, locale, seasons, cards] = await Promise.all([searchParams, getAdminLocale(), seasonsRepository.getAll(), cardsRepository.getAll()]);
  const counts = new Map<string, number>();
  cards.forEach((card) => counts.set(card.seasonId, (counts.get(card.seasonId) ?? 0) + 1));
  return <><NoticeToast message={notice} /><AdminPageHeader title="Seasons" description="Organize the Codex timeline and select the single season featured on the public landing page." action={{ href: "/admin/seasons/new", label: "Add Season" }} />
    {seasons.length === 0 ? <EmptyState icon={Sparkles} title="No seasons yet." description="Create the first season before adding sets and cards." action={{ href: "/admin/seasons/new", label: "Add Season" }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>Order</AdminTableHeader><AdminTableHeader>Name / Slug</AdminTableHeader><AdminTableHeader>Release date</AdminTableHeader><AdminTableHeader>Active</AdminTableHeader><AdminTableHeader>Featured</AdminTableHeader><AdminTableHeader>Cards</AdminTableHeader><AdminTableHeader>Updated</AdminTableHeader><AdminTableHeader className="text-right">Actions</AdminTableHeader></tr></AdminTableHead><tbody>{seasons.map((season) => { const name = localizedLabel(season.translations, locale); return <AdminTableRow key={season.id}><AdminTableCell className="font-mono">{season.number}</AdminTableCell><AdminTableCell><Link href={`/admin/seasons/${season.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link><p className="text-xs text-muted-foreground">{season.slug}</p></AdminTableCell><AdminTableCell>{formatTimestamp(season.releaseDate, locale)}</AdminTableCell><AdminTableCell><EntityStatusBadge active={season.isActive} /></AdminTableCell><AdminTableCell>{season.isFeatured ? <Badge>Featured</Badge> : "—"}</AdminTableCell><AdminTableCell>{counts.get(season.id) ?? 0}</AdminTableCell><AdminTableCell className="text-xs text-muted-foreground">{formatTimestamp(season.updatedAt, locale)}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/seasons/${season.id}`} entityName={name} deleteAction={deleteSeasonAction.bind(null, season.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}
  </>;
}
