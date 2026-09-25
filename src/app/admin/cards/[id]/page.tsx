import { notFound } from "next/navigation";

import { updateCardAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumbTitle } from "@/components/admin/admin-breadcrumbs";
import { CardForm } from "@/components/admin/card-form";
import { formatTimestamp, localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { glossaryRepository } from "@/repositories/glossary.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [locale, card, seasons, sets, rarities, types, glossary] = await Promise.all([getAdminLocale(), cardsRepository.getById(id), seasonsRepository.getAll(), setsRepository.getAll(), raritiesRepository.getAll(), cardTypesRepository.getAll(), glossaryRepository.getAll()]);
  if (!card) notFound();
  const name = localizedLabel(card.translations, locale);
  const initial = { ...card, createdAt: formatTimestamp(card.createdAt, locale, true), updatedAt: formatTimestamp(card.updatedAt, locale, true) };
  return (
    <>
      <AdminBreadcrumbTitle title={name} />
      <AdminPageHeader eyebrow="Edit Card" title={`#${String(card.number).padStart(3, "0")} — ${name}`} description="Update this card without changing its original document identity." />
      <CardForm action={updateCardAction.bind(null, id)} mode="edit" initial={initial} seasons={seasons.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale) }))} sets={sets.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale), seasonId: entry.seasonId }))} rarities={rarities.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale), color: entry.visual?.color }))} types={types.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale), color: entry.visual?.color }))} glossary={glossary.map(({ id: entryId, key, translations }) => ({ id: entryId, key, translations }))} />
    </>
  );
}
