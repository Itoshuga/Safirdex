import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { deleteSeasonAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import { NoticeToast } from "@/components/admin/notice-toast";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp, localizedLabel } from "@/features/admin/presentation";
import { Link } from "@/i18n/navigation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardsRepository } from "@/repositories/cards.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";

export default async function SeasonsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [t, entities, table, status, { notice }, locale, seasons, cards] = await Promise.all([getTranslations("Admin.seasons"), getTranslations("Admin.entities"), getTranslations("Admin.table"), getTranslations("Admin.status"), searchParams, getAdminLocale(), seasonsRepository.getAll(), cardsRepository.getAll()]);
  const counts = new Map<string, number>();
  cards.forEach((card) => counts.set(card.seasonId, (counts.get(card.seasonId) ?? 0) + 1));
  return <><NoticeToast message={notice} /><AdminPageHeader title={entities("seasons")} description={t("description")} action={{ href: "/admin/seasons/new", label: t("add") }} />
    {seasons.length === 0 ? <EmptyState icon={Sparkles} title={t("emptyTitle")} description={t("emptyDescription")} action={{ href: "/admin/seasons/new", label: t("add") }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>{table("order")}</AdminTableHeader><AdminTableHeader>{table("nameSlug")}</AdminTableHeader><AdminTableHeader>{table("releaseDate")}</AdminTableHeader><AdminTableHeader>{table("active")}</AdminTableHeader><AdminTableHeader>{table("featured")}</AdminTableHeader><AdminTableHeader>{table("cards")}</AdminTableHeader><AdminTableHeader>{table("updated")}</AdminTableHeader><AdminTableHeader className="text-right">{table("actions")}</AdminTableHeader></tr></AdminTableHead><tbody>{seasons.map((season) => { const name = localizedLabel(season.translations, locale); return <AdminTableRow key={season.id}><AdminTableCell className="font-mono">{season.number}</AdminTableCell><AdminTableCell><Link href={`/admin/seasons/${season.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link><p className="text-xs text-muted-foreground">{season.slug}</p></AdminTableCell><AdminTableCell>{formatTimestamp(season.releaseDate, locale)}</AdminTableCell><AdminTableCell><EntityStatusBadge active={season.isActive} /></AdminTableCell><AdminTableCell>{season.isFeatured ? <Badge>{status("featured")}</Badge> : "—"}</AdminTableCell><AdminTableCell>{counts.get(season.id) ?? 0}</AdminTableCell><AdminTableCell className="text-xs text-muted-foreground">{formatTimestamp(season.updatedAt, locale)}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/seasons/${season.id}`} entityName={name} deleteAction={deleteSeasonAction.bind(null, season.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}
  </>;
}
