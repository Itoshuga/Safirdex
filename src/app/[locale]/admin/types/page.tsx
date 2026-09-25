import { Shapes } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { deleteTypeAction } from "@/app/[locale]/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { Badge } from "@/components/ui/badge";
import { localizedLabel } from "@/features/admin/presentation";
import { Link } from "@/i18n/navigation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";

export default async function TypesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) { const [t, entities, table, states, { notice }, locale, types, cards] = await Promise.all([getTranslations("Admin.types"), getTranslations("Admin.entities"), getTranslations("Admin.table"), getTranslations("Common.states"), searchParams, getAdminLocale(), cardTypesRepository.getAll(), cardsRepository.getAll()]); const counts = new Map<string, number>(); cards.forEach((card) => card.typeIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))); return <><NoticeToast message={notice} /><AdminPageHeader title={entities("types")} description={t("description")} action={{ href: "/admin/types/new", label: t("add") }} />{types.length === 0 ? <EmptyState icon={Shapes} title={t("emptyTitle")} description={t("emptyDescription")} action={{ href: "/admin/types/new", label: t("add") }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>{table("name")}</AdminTableHeader><AdminTableHeader>{table("slug")}</AdminTableHeader><AdminTableHeader>{table("color")}</AdminTableHeader><AdminTableHeader>{table("icon")}</AdminTableHeader><AdminTableHeader>{table("cards")}</AdminTableHeader><AdminTableHeader className="text-right">{table("actions")}</AdminTableHeader></tr></AdminTableHead><tbody>{types.map((type) => { const name = localizedLabel(type.translations, locale); return <AdminTableRow key={type.id}><AdminTableCell><Link href={`/admin/types/${type.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link></AdminTableCell><AdminTableCell className="font-mono text-xs text-muted-foreground">{type.slug}</AdminTableCell><AdminTableCell><Badge variant="outline" style={{ borderColor: type.visual?.color, color: type.visual?.color }}><span className="size-2 rounded-full" style={{ background: type.visual?.color }} />{type.visual?.color ?? states("notSet")}</Badge></AdminTableCell><AdminTableCell className="max-w-40 truncate font-mono text-[10px] text-muted-foreground">{type.visual?.iconStoragePath ?? "—"}</AdminTableCell><AdminTableCell>{counts.get(type.id) ?? 0}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/types/${type.id}`} entityName={name} deleteAction={deleteTypeAction.bind(null, type.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>; }
