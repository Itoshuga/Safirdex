import { Filter, Layers3, Search, X } from "lucide-react";
import Link from "next/link";

import {
  deleteCardAction,
  duplicateCardAction,
} from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "@/components/admin/admin-table";
import { EmptyState } from "@/components/admin/empty-state";
import { EntityRowActions } from "@/components/admin/entity-row-actions";
import { NoticeToast } from "@/components/admin/notice-toast";
import { Pagination } from "@/components/admin/pagination";
import { StorageImage } from "@/components/admin/storage-image";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp, localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function CardsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [locale, cards, seasons, sets, rarities, types] = await Promise.all([
    getAdminLocale(), cardsRepository.getAll(), seasonsRepository.getAll(), setsRepository.getAll(), raritiesRepository.getAll(), cardTypesRepository.getAll(),
  ]);
  const search = one(params.q).trim().toLowerCase();
  const season = one(params.season);
  const set = one(params.set);
  const rarity = one(params.rarity);
  const type = one(params.type);
  const commander = one(params.commander);
  const promo = one(params.promo);
  const sort = one(params.sort) || "updated";
  const pageSizeCandidate = Number(one(params.limit) || 25);
  const pageSize = [25, 50, 100].includes(pageSizeCandidate) ? pageSizeCandidate : 25;

  const filtered = cards.filter((card) => {
    const names = Object.values(card.translations).map((translation) => translation.name.toLowerCase());
    return (!search || card.slug.toLowerCase().includes(search) || String(card.number).includes(search) || names.some((name) => name.includes(search)))
      && (!season || card.seasonId === season)
      && (!set || card.setId === set)
      && (!rarity || card.rarityId === rarity)
      && (!type || card.typeIds.includes(type))
      && (!commander || String(card.isCommander) === commander)
      && (!promo || String(card.isPromo) === promo);
  }).sort((a, b) => sort === "number" ? a.number - b.number : sort === "created" ? b.createdAt.toMillis() - a.createdAt.toMillis() : b.updatedAt.toMillis() - a.updatedAt.toMillis());

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, Number(one(params.page) || 1)), pages);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = Boolean(search || season || set || rarity || type || commander || promo || sort !== "updated" || pageSize !== 25);
  const seasonById = new Map(seasons.map((entry) => [entry.id, localizedLabel(entry.translations, locale)]));
  const setById = new Map(sets.map((entry) => [entry.id, localizedLabel(entry.translations, locale)]));
  const rarityById = new Map(rarities.map((entry) => [entry.id, entry]));
  const typeById = new Map(types.map((entry) => [entry.id, localizedLabel(entry.translations, locale)]));
  const makeHref = (nextPage: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (typeof value === "string" && key !== "notice") next.set(key, value);
    next.set("page", String(nextPage));
    return `/admin/cards?${next}`;
  };

  return (
    <>
      <NoticeToast message={one(params.notice)} />
      <AdminPageHeader title="Cards" description="Manage every card available in Safir, including classification, translations, stats and artwork." action={{ href: "/admin/cards/new", label: "Add Card" }} />
      <form className="mb-4 rounded-xl border bg-card p-3" method="get">
        <div className="grid gap-2 lg:grid-cols-[minmax(15rem,1fr)_repeat(3,minmax(9rem,auto))_auto]">
          <label className="relative"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search cards</span><input className="admin-input pl-9" name="q" defaultValue={search} placeholder="Search name, number or slug…" /></label>
          <select className="admin-input" name="season" defaultValue={season} aria-label="Filter by season"><option value="">All seasons</option>{seasons.map((entry) => <option key={entry.id} value={entry.id}>{localizedLabel(entry.translations, locale)}</option>)}</select>
          <select className="admin-input" name="rarity" defaultValue={rarity} aria-label="Filter by rarity"><option value="">All rarities</option>{rarities.map((entry) => <option key={entry.id} value={entry.id}>{localizedLabel(entry.translations, locale)}</option>)}</select>
          <select className="admin-input" name="type" defaultValue={type} aria-label="Filter by type"><option value="">All types</option>{types.map((entry) => <option key={entry.id} value={entry.id}>{localizedLabel(entry.translations, locale)}</option>)}</select>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit"><Filter className="size-4" /> Filter</button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <select className="admin-input h-9" name="set" defaultValue={set} aria-label="Filter by set"><option value="">All sets</option>{sets.filter((entry) => !season || entry.seasonId === season).map((entry) => <option key={entry.id} value={entry.id}>{localizedLabel(entry.translations, locale)}</option>)}</select>
          <select className="admin-input h-9" name="commander" defaultValue={commander} aria-label="Filter commanders"><option value="">Commander: any</option><option value="true">Commander only</option><option value="false">Not commander</option></select>
          <select className="admin-input h-9" name="promo" defaultValue={promo} aria-label="Filter promos"><option value="">Promo: any</option><option value="true">Promo only</option><option value="false">Not promo</option></select>
          <select className="admin-input h-9" name="sort" defaultValue={sort} aria-label="Sort cards"><option value="updated">Recently updated</option><option value="created">Recently created</option><option value="number">Card number</option></select>
          <select className="admin-input h-9" name="limit" defaultValue={pageSize} aria-label="Items per page"><option value="25">25 / page</option><option value="50">50 / page</option><option value="100">100 / page</option></select>
          {hasFilters ? <Link href="/admin/cards" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-3.5" /> Clear filters</Link> : null}
        </div>
      </form>

      {cards.length === 0 ? <EmptyState icon={Layers3} title="No cards yet." description="Create your first Safir card to get started." action={{ href: "/admin/cards/new", label: "Add Card" }} /> : visible.length === 0 ? <div className="rounded-xl border border-dashed py-20 text-center"><Search className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="font-medium">No cards match these filters.</p><Link href="/admin/cards" className="mt-2 inline-block text-sm text-safir hover:underline">Clear all filters</Link></div> : (
        <>
          <div className="hidden md:block">
            <AdminTable>
              <AdminTableHead><tr><AdminTableHeader>Artwork</AdminTableHeader><AdminTableHeader>Number / Name</AdminTableHeader><AdminTableHeader>Season / Set</AdminTableHeader><AdminTableHeader>Rarity</AdminTableHeader><AdminTableHeader>Types</AdminTableHeader><AdminTableHeader>Stats</AdminTableHeader><AdminTableHeader>Flags</AdminTableHeader><AdminTableHeader>Updated</AdminTableHeader><AdminTableHeader className="text-right">Actions</AdminTableHeader></tr></AdminTableHead>
              <tbody>{visible.map((card) => {
                const cardName = localizedLabel(card.translations, locale);
                const rarityEntity = rarityById.get(card.rarityId);
                return <AdminTableRow key={card.id}>
                  <AdminTableCell><StorageImage storagePath={card.artwork.storagePath} url={card.artwork.url} alt={cardName} className="h-12 w-10 rounded-md border" /></AdminTableCell>
                  <AdminTableCell><Link href={`/admin/cards/${card.id}`} className="font-medium hover:text-safir hover:underline">#{String(card.number).padStart(3, "0")} — {cardName}</Link><p className="mt-0.5 max-w-56 truncate text-xs text-muted-foreground">{card.slug}</p></AdminTableCell>
                  <AdminTableCell><p>{seasonById.get(card.seasonId) ?? "Unknown"}</p><p className="text-xs text-muted-foreground">{card.setId ? setById.get(card.setId) ?? "Unknown set" : "No set"}</p></AdminTableCell>
                  <AdminTableCell>{rarityEntity ? <Badge variant="outline" style={{ borderColor: rarityEntity.visual?.color, color: rarityEntity.visual?.color }}>{localizedLabel(rarityEntity.translations, locale)}</Badge> : "—"}</AdminTableCell>
                  <AdminTableCell><div className="flex max-w-40 flex-wrap gap-1">{card.typeIds.map((id) => <Badge variant="secondary" key={id}>{typeById.get(id) ?? id}</Badge>)}</div></AdminTableCell>
                  <AdminTableCell><div className="flex gap-1 font-mono text-[11px]"><span className="rounded bg-muted px-1.5 py-1">A {card.attack}</span><span className="rounded bg-muted px-1.5 py-1">V {card.value}</span><span className="rounded bg-muted px-1.5 py-1">D {card.defense}</span></div></AdminTableCell>
                  <AdminTableCell><div className="flex gap-1">{card.isCommander ? <Badge>CMD</Badge> : null}{card.isPromo ? <Badge variant="outline">Promo</Badge> : null}{!card.isCommander && !card.isPromo ? <span className="text-muted-foreground">—</span> : null}</div></AdminTableCell>
                  <AdminTableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTimestamp(card.updatedAt, locale)}</AdminTableCell>
                  <AdminTableCell><EntityRowActions editHref={`/admin/cards/${card.id}`} entityName={cardName} deleteAction={deleteCardAction.bind(null, card.id)} duplicateAction={duplicateCardAction.bind(null, card.id)} /></AdminTableCell>
                </AdminTableRow>;
              })}</tbody>
            </AdminTable>
          </div>
          <div className="space-y-2 md:hidden">{visible.map((card) => { const name = localizedLabel(card.translations, locale); return <article key={card.id} className="flex gap-3 rounded-xl border bg-card p-3"><StorageImage storagePath={card.artwork.storagePath} url={card.artwork.url} alt={name} className="h-20 w-16 shrink-0 rounded-lg border" /><div className="min-w-0 flex-1"><Link href={`/admin/cards/${card.id}`} className="block truncate font-medium">#{String(card.number).padStart(3, "0")} — {name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{seasonById.get(card.seasonId)} · {rarityById.get(card.rarityId) ? localizedLabel(rarityById.get(card.rarityId)!.translations, locale) : "—"}</p><div className="mt-2 flex items-center justify-between"><span className="font-mono text-[11px]">A {card.attack} / V {card.value} / D {card.defense}</span><EntityRowActions editHref={`/admin/cards/${card.id}`} entityName={name} deleteAction={deleteCardAction.bind(null, card.id)} duplicateAction={duplicateCardAction.bind(null, card.id)} /></div></div></article>; })}</div>
          <Pagination page={page} pages={pages} total={filtered.length} pageSize={pageSize} makeHref={makeHref} />
        </>
      )}
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Search currently filters the loaded catalogue server-side by name, number and slug. Cursor-based Firestore pagination is the planned upgrade when the catalogue outgrows this first back-office dataset.</p>
    </>
  );
}
