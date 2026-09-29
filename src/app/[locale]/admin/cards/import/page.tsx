import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CardJsonImportForm } from "@/components/admin/card-json-import-form";
import { localizedLabel } from "@/features/admin/presentation";
import { getAdminLocale } from "@/lib/i18n/admin-locale";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { factionsRepository } from "@/repositories/factions.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";

export default async function ImportCardsPage() {
  const [t, locale, seasons, rarities, types, factions] = await Promise.all([
    getTranslations("Admin.cards.import"),
    getAdminLocale(),
    seasonsRepository.getAll(),
    raritiesRepository.getAll(),
    cardTypesRepository.getAll(),
    factionsRepository.getAll(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <CardJsonImportForm
        seasons={seasons.map((season) => ({
          id: season.id,
          label: localizedLabel(season.translations, locale),
        }))}
        rarities={rarities.map((rarity) => ({
          id: rarity.id,
          label: localizedLabel(rarity.translations, locale),
          slug: rarity.slug,
        }))}
        types={types.map((type) => ({
          id: type.id,
          label: localizedLabel(type.translations, locale),
          slug: type.slug,
        }))}
        factions={factions.map((faction) => ({
          id: faction.id,
          label: localizedLabel(faction.translations, locale),
          slug: faction.slug,
        }))}
      />
    </>
  );
}
