import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { deleteFactionAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { Badge } from "@/components/ui/badge";
import { localizedLabel } from "@/features/admin/presentation";
import { Link } from "@/i18n/navigation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardsRepository } from "@/repositories/cards.repository";
import { factionsRepository } from "@/repositories/factions.repository";

export default async function FactionsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [t, table, states, { notice }, locale, factions, cards] = await Promise.all([getTranslations("Admin.factions"), getTranslations("Admin.table"), getTranslations("Common.states"), searchParams, getAdminLocale(), factionsRepository.getAll(), cardsRepository.getAll()]);
  const counts = new Map<string, number>();
  cards.forEach((card) => card.factionIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
  return <><NoticeToast message={notice} /><AdminPageHeader title={t("title")} description={t("description")} action={{ href: "/admin/factions/new", label: t("add") }} />{factions.length === 0 ? <EmptyState icon={Sparkles} title={t("emptyTitle")} description={t("emptyDescription")} action={{ href: "/admin/factions/new", label: t("add") }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>{table("name")}</AdminTableHeader><AdminTableHeader>{table("slug")}</AdminTableHeader><AdminTableHeader>{table("color")}</AdminTableHeader><AdminTableHeader>{table("cards")}</AdminTableHeader><AdminTableHeader className="text-right">{table("actions")}</AdminTableHeader></tr></AdminTableHead><tbody>{factions.map((faction) => { const name = localizedLabel(faction.translations, locale); return <AdminTableRow key={faction.id}><AdminTableCell><Link href={`/admin/factions/${faction.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link></AdminTableCell><AdminTableCell className="font-mono text-xs text-muted-foreground">{faction.slug}</AdminTableCell><AdminTableCell><Badge variant="outline" style={{ borderColor: faction.visual?.color, color: faction.visual?.color }}><span className="size-2 rounded-full" style={{ background: faction.visual?.color }} />{faction.visual?.color ?? states("notSet")}</Badge></AdminTableCell><AdminTableCell>{counts.get(faction.id) ?? 0}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/factions/${faction.id}`} entityName={name} deleteAction={deleteFactionAction.bind(null, faction.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>;
}
