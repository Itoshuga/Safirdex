import { Diamond } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { deleteRarityAction } from "@/app/[locale]/admin/actions";
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
import { raritiesRepository } from "@/repositories/rarities.repository";

export default async function RaritiesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [t, entities, table, states, { notice }, locale, rarities, cards] = await Promise.all([getTranslations("Admin.rarities"), getTranslations("Admin.entities"), getTranslations("Admin.table"), getTranslations("Common.states"), searchParams, getAdminLocale(), raritiesRepository.getAll(), cardsRepository.getAll()]);
  const counts = new Map<string, number>(); cards.forEach((card) => counts.set(card.rarityId, (counts.get(card.rarityId) ?? 0) + 1));
  return <><NoticeToast message={notice} /><AdminPageHeader title={entities("rarities")} description={t("description")} action={{ href: "/admin/rarities/new", label: t("add") }} />{rarities.length === 0 ? <EmptyState icon={Diamond} title={t("emptyTitle")} description={t("emptyDescription")} action={{ href: "/admin/rarities/new", label: t("add") }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>{table("name")}</AdminTableHeader><AdminTableHeader>{table("slug")}</AdminTableHeader><AdminTableHeader>{table("order")}</AdminTableHeader><AdminTableHeader>{table("color")}</AdminTableHeader><AdminTableHeader>{table("icon")}</AdminTableHeader><AdminTableHeader>{table("cards")}</AdminTableHeader><AdminTableHeader className="text-right">{table("actions")}</AdminTableHeader></tr></AdminTableHead><tbody>{rarities.map((rarity) => { const name = localizedLabel(rarity.translations, locale); return <AdminTableRow key={rarity.id}><AdminTableCell><Link href={`/admin/rarities/${rarity.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link></AdminTableCell><AdminTableCell className="font-mono text-xs text-muted-foreground">{rarity.slug}</AdminTableCell><AdminTableCell>{rarity.order}</AdminTableCell><AdminTableCell><Badge variant="outline" style={{ borderColor: rarity.visual?.color, color: rarity.visual?.color }}><span className="size-2 rounded-full" style={{ background: rarity.visual?.color }} />{rarity.visual?.color ?? states("notSet")}</Badge></AdminTableCell><AdminTableCell className="max-w-40 truncate font-mono text-[10px] text-muted-foreground">{rarity.visual?.iconStoragePath ?? "—"}</AdminTableCell><AdminTableCell>{counts.get(rarity.id) ?? 0}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/rarities/${rarity.id}`} entityName={name} deleteAction={deleteRarityAction.bind(null, rarity.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>;
}
