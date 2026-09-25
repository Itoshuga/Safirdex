import { Shapes } from "lucide-react";
import Link from "next/link";

import { deleteTypeAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeader, AdminTableRow } from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { Badge } from "@/components/ui/badge";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";

export default async function TypesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) { const [{ notice }, locale, types, cards] = await Promise.all([searchParams, getAdminLocale(), cardTypesRepository.getAll(), cardsRepository.getAll()]); const counts = new Map<string, number>(); cards.forEach((card) => card.typeIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))); return <><NoticeToast message={notice} /><AdminPageHeader title="Card Types" description="Maintain the multi-select taxonomy used to classify cards." action={{ href: "/admin/types/new", label: "Add Type" }} />{types.length === 0 ? <EmptyState icon={Shapes} title="No card types yet." description="Create the gameplay types available in card classification." action={{ href: "/admin/types/new", label: "Add Type" }} /> : <AdminTable><AdminTableHead><tr><AdminTableHeader>Name</AdminTableHeader><AdminTableHeader>Slug</AdminTableHeader><AdminTableHeader>Color</AdminTableHeader><AdminTableHeader>Icon</AdminTableHeader><AdminTableHeader>Cards</AdminTableHeader><AdminTableHeader className="text-right">Actions</AdminTableHeader></tr></AdminTableHead><tbody>{types.map((type) => { const name = localizedLabel(type.translations, locale); return <AdminTableRow key={type.id}><AdminTableCell><Link href={`/admin/types/${type.id}`} className="font-medium hover:text-safir hover:underline">{name}</Link></AdminTableCell><AdminTableCell className="font-mono text-xs text-muted-foreground">{type.slug}</AdminTableCell><AdminTableCell><Badge variant="outline" style={{ borderColor: type.visual?.color, color: type.visual?.color }}><span className="size-2 rounded-full" style={{ background: type.visual?.color }} />{type.visual?.color ?? "Not set"}</Badge></AdminTableCell><AdminTableCell className="max-w-40 truncate font-mono text-[10px] text-muted-foreground">{type.visual?.iconStoragePath ?? "—"}</AdminTableCell><AdminTableCell>{counts.get(type.id) ?? 0}</AdminTableCell><AdminTableCell><EntityRowActions editHref={`/admin/types/${type.id}`} entityName={name} deleteAction={deleteTypeAction.bind(null, type.id)} /></AdminTableCell></AdminTableRow>; })}</tbody></AdminTable>}</>; }
