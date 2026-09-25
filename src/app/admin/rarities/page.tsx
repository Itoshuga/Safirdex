import { Diamond } from "lucide-react";
import Link from "next/link";

import { deleteRarityAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { Badge } from "@/components/ui/badge";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardsRepository } from "@/repositories/cards.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";

export default async function RaritiesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [{ notice }, locale, rarities, cards] = await Promise.all([searchParams, getAdminLocale(), raritiesRepository.getAll(), cardsRepository.getAll()]);
  const counts = new Map<string, number>(); cards.forEach((card) => counts.set(card.rarityId, (counts.get(card.rarityId) ?? 0) + 1));
  return <><NoticeToast message={notice} /><AdminPageHeader title="Rarities" description="Control rarity ordering, color and iconography across the Codex." action={{ href: "/admin/rarities/new", label: "Add Rarity" }} />{rarities.length === 0 ? <EmptyState icon={Diamond} title="No rarities yet." description="Create the rarity scale used to classify Safir cards." action={{ href: "/admin/rarities/new", label: "Add Rarity" }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>Name</AdminTableHeader><AdminTableHeader>Slug</AdminTableHeader><AdminTableHeader>Order</AdminTableHeader><AdminTableHeader>Color</AdminTableHeader><AdminTableHeader>Icon</AdminTableHeader><AdminTableHeader>Cards</AdminTableHeader><AdminTableHeader className="text-right">Actions</AdminTableHeader></tr></AdminTableHead><tbody>{rarities.map((rarity) => { const name = localizedLabel(rarity.translations, locale); return <AdminTableRow key={rarity.id}><AdminTableCell><Link href={`/admin/rarities/${rarity.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link></AdminTableCell><AdminTableCell className="font-mono text-xs text-muted-foreground">{rarity.slug}</AdminTableCell><AdminTableCell>{rarity.order}</AdminTableCell><AdminTableCell><Badge variant="outline" style={{ borderColor: rarity.visual?.color, color: rarity.visual?.color }}><span className="size-2 rounded-full" style={{ background: rarity.visual?.color }} />{rarity.visual?.color ?? "Not set"}</Badge></AdminTableCell><AdminTableCell className="max-w-40 truncate font-mono text-[10px] text-muted-foreground">{rarity.visual?.iconStoragePath ?? "—"}</AdminTableCell><AdminTableCell>{counts.get(rarity.id) ?? 0}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/rarities/${rarity.id}`} entityName={name} deleteAction={deleteRarityAction.bind(null, rarity.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>;
}
