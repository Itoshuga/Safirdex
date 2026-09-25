import {
  ArrowRight,
  BookOpenText,
  Boxes,
  Diamond,
  Layers3,
  Plus,
  Shapes,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StorageImage } from "@/components/admin/storage-image";
import { formatTimestamp, localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { glossaryRepository } from "@/repositories/glossary.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";

const statConfig = [
  { key: "cards", label: "Total Cards", icon: Layers3, href: "/admin/cards" },
  { key: "seasons", label: "Seasons", icon: Sparkles, href: "/admin/seasons" },
  { key: "sets", label: "Sets", icon: Boxes, href: "/admin/sets" },
  { key: "rarities", label: "Rarities", icon: Diamond, href: "/admin/rarities" },
  { key: "types", label: "Card Types", icon: Shapes, href: "/admin/types" },
  { key: "glossary", label: "Glossary Entries", icon: BookOpenText, href: "/admin/glossary" },
] as const;

export default async function AdminDashboardPage() {
  const [locale, cards, seasons, sets, rarities, types, glossary] = await Promise.all([
    getAdminLocale(),
    cardsRepository.getAll(),
    seasonsRepository.getAll(),
    setsRepository.getAll(),
    raritiesRepository.getAll(),
    cardTypesRepository.getAll(),
    glossaryRepository.getAll(),
  ]);
  const counts = { cards: cards.length, seasons: seasons.length, sets: sets.length, rarities: rarities.length, types: types.length, glossary: glossary.length };
  const recent = [...cards].sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis()).slice(0, 6);
  const quickActions = [
    ["Add Card", "/admin/cards/new"],
    ["Add Season", "/admin/seasons/new"],
    ["Add Set", "/admin/sets/new"],
    ["Add Glossary Entry", "/admin/glossary/new"],
  ] as const;

  return (
    <>
      <AdminPageHeader eyebrow="Overview" title="Dashboard" description="A concise view of the Safir catalogue and the content that needs your attention." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statConfig.map(({ key, label, icon: Icon, href }) => (
          <Link href={href} key={key} className="group flex items-center justify-between rounded-xl border bg-card p-5 transition hover:border-safir/30 hover:shadow-lg hover:shadow-safir/5">
            <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{counts[key]}</p></div>
            <span className="grid size-10 place-items-center rounded-xl bg-safir/8 text-safir transition group-hover:bg-safir group-hover:text-safir-foreground"><Icon className="size-5" /></span>
          </Link>
        ))}
      </section>
      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-heading text-xl font-semibold">Recent Cards</h2><p className="text-xs text-muted-foreground">Latest catalogue activity</p></div><Link href="/admin/cards" className="flex items-center gap-1 text-xs font-medium text-safir hover:underline">View all <ArrowRight className="size-3.5" /></Link></div>
          {recent.length ? <div className="divide-y">{recent.map((card) => (
            <Link href={`/admin/cards/${card.id}`} key={card.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-muted/35">
              <StorageImage storagePath={card.artwork.storagePath} url={card.artwork.url} alt="" className="size-10 shrink-0 rounded-lg border" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{localizedLabel(card.translations, locale)}</p><p className="truncate text-xs text-muted-foreground">#{String(card.number).padStart(3, "0")} · {card.slug}</p></div>
              <time className="hidden text-xs text-muted-foreground sm:block">{formatTimestamp(card.updatedAt, locale)}</time>
            </Link>
          ))}</div> : <p className="px-5 py-12 text-center text-sm text-muted-foreground">No cards yet.</p>}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-xl font-semibold">Quick Actions</h2>
          <p className="mt-0.5 mb-4 text-xs text-muted-foreground">Create new catalogue content.</p>
          <div className="space-y-2">{quickActions.map(([label, href]) => <Link key={href} href={href} className="flex h-10 items-center justify-between rounded-lg border px-3 text-sm font-medium transition hover:border-safir/30 hover:bg-safir/5"><span className="flex items-center gap-2"><Plus className="size-4 text-safir" />{label}</span><ArrowRight className="size-3.5 text-muted-foreground" /></Link>)}</div>
        </section>
      </div>
    </>
  );
}
