import { createCardAction } from "@/app/[locale]/admin/actions";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CardForm } from "@/components/admin/card-form";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { localizedLabel } from "@/features/admin/presentation";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { glossaryRepository } from "@/repositories/glossary.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";

export default async function NewCardPage() {
  const [t, locale, seasons, sets, rarities, types, glossary] = await Promise.all([getTranslations("Admin.cards"), getAdminLocale(), seasonsRepository.getAll(), setsRepository.getAll(), raritiesRepository.getAll(), cardTypesRepository.getAll(), glossaryRepository.getAll()]);
  return (
    <>
      <AdminPageHeader eyebrow={t("newEyebrow")} title={t("createTitle")} description={t("createDescription")} />
      <CardForm action={createCardAction} mode="create" seasons={seasons.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale) }))} sets={sets.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale), seasonId: entry.seasonId }))} rarities={rarities.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale), color: entry.visual?.color }))} types={types.map((entry) => ({ id: entry.id, label: localizedLabel(entry.translations, locale), color: entry.visual?.color }))} glossary={glossary.map(({ id, key, translations }) => ({ id, key, translations }))} />
    </>
  );
}
