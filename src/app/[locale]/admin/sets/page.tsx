import { Boxes } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { deleteSetAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { formatTimestamp, localizedLabel } from "@/features/admin/presentation";
import { Link } from "@/i18n/navigation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardsRepository } from "@/repositories/cards.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";

export default async function SetsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [t, entities, table, states, { notice }, locale, sets, seasons, cards] = await Promise.all([getTranslations("Admin.sets"), getTranslations("Admin.entities"), getTranslations("Admin.table"), getTranslations("Common.states"), searchParams, getAdminLocale(), setsRepository.getAll(), seasonsRepository.getAll(), cardsRepository.getAll()]);
  const seasonNames = new Map(seasons.map((entry) => [entry.id, localizedLabel(entry.translations, locale)]));
  const counts = new Map<string, number>(); cards.forEach((card) => card.setId && counts.set(card.setId, (counts.get(card.setId) ?? 0) + 1));
  return <><NoticeToast message={notice} /><AdminPageHeader title={entities("sets")} description={t("description")} action={{ href: "/admin/sets/new", label: t("add") }} />{sets.length === 0 ? <EmptyState icon={Boxes} title={t("emptyTitle")} description={t("emptyDescription")} action={{ href: "/admin/sets/new", label: t("add") }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>{table("name")}</AdminTableHeader><AdminTableHeader>{table("code")}</AdminTableHeader><AdminTableHeader>{table("season")}</AdminTableHeader><AdminTableHeader>{table("releaseDate")}</AdminTableHeader><AdminTableHeader>{table("cards")}</AdminTableHeader><AdminTableHeader>{table("updated")}</AdminTableHeader><AdminTableHeader className="text-right">{table("actions")}</AdminTableHeader></tr></AdminTableHead><tbody>{sets.map((set) => { const name = localizedLabel(set.translations, locale); return <AdminTableRow key={set.id}><AdminTableCell><Link href={`/admin/sets/${set.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link><p className="text-xs text-muted-foreground">{set.slug}</p></AdminTableCell><AdminTableCell className="font-mono text-xs">{set.code ?? "—"}</AdminTableCell><AdminTableCell>{seasonNames.get(set.seasonId) ?? states("unknown")}</AdminTableCell><AdminTableCell>{formatTimestamp(set.releaseDate, locale)}</AdminTableCell><AdminTableCell>{counts.get(set.id) ?? 0}</AdminTableCell><AdminTableCell className="text-xs text-muted-foreground">{formatTimestamp(set.updatedAt, locale)}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/sets/${set.id}`} entityName={name} deleteAction={deleteSetAction.bind(null, set.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>;
}
