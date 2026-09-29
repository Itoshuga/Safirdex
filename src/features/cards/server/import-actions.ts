"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath, updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";

import {
  cardJsonImportRowSchema,
  type CardImportActionState,
  type CardImportIssue,
  MAX_CARD_IMPORT_BYTES,
  MAX_CARD_IMPORT_ROWS,
  parseCardJsonImportText,
} from "@/features/cards/card-json-import";
import { CODEX_CACHE_TAGS } from "@/features/cards/server/cache-tags";
import { buildCardDisplaySnapshots } from "@/features/cards/server/display-snapshots";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { createSlug } from "@/lib/utils/slug";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { factionsRepository } from "@/repositories/factions.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import type { CreateCardInput } from "@/types/card";
import { createCardSchema } from "@/validation/schemas";

const MAX_RETURNED_ISSUES = 100;

function availableSlug(name: string, takenSlugs: Set<string>) {
  const base = createSlug(name).slice(0, 150).replace(/-+$/g, "");
  let slug = base;
  let suffix = 2;

  while (takenSlugs.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  takenSlugs.add(slug);
  return slug;
}

function addIssue(issues: CardImportIssue[], issue: CardImportIssue) {
  if (issues.length < MAX_RETURNED_ISSUES) issues.push(issue);
}

export async function importCardsAction(
  _state: CardImportActionState,
  formData: FormData,
): Promise<CardImportActionState> {
  const t = await getTranslations("Admin.cards.import");
  let rowCount = 0;

  try {
    await requireAdminSession();

    const seasonId = formData.get("seasonId");
    const fallbackRarityId = formData.get("fallbackRarityId");
    const file = formData.get("jsonFile");

    if (typeof seasonId !== "string" || !seasonId.trim()) {
      return { status: "error", message: t("seasonRequired"), imported: 0, skipped: 0, issues: [] };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", message: t("fileRequired"), imported: 0, skipped: 0, issues: [] };
    }
    if (file.size > MAX_CARD_IMPORT_BYTES) {
      return { status: "error", message: t("fileTooLarge"), imported: 0, skipped: 0, issues: [] };
    }

    let rows: unknown[];
    try {
      rows = parseCardJsonImportText(await file.text());
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      const message = code === "JSON_ARRAY_REQUIRED"
        ? t("arrayRequired")
        : code === "JSON_EMPTY"
          ? t("emptyFile")
          : code === "JSON_TOO_MANY_ROWS"
            ? t("tooManyRows", { count: MAX_CARD_IMPORT_ROWS })
            : t("invalidJson");
      return { status: "error", message, imported: 0, skipped: 0, issues: [] };
    }
    rowCount = rows.length;

    const [season, rarities, types, factions, existingCards] = await Promise.all([
      seasonsRepository.getById(seasonId),
      raritiesRepository.getAll(),
      cardTypesRepository.getAll(),
      factionsRepository.getAll(),
      cardsRepository.getAll(),
    ]);

    if (!season) {
      return { status: "error", message: t("seasonMissing"), imported: 0, skipped: rowCount, issues: [] };
    }

    const rarityBySlug = new Map(rarities.map((rarity) => [rarity.slug.toLowerCase(), rarity]));
    const rarityById = new Map(rarities.map((rarity) => [rarity.id, rarity]));
    const typeBySlug = new Map(types.map((type) => [type.slug.toLowerCase(), type]));
    const factionBySlug = new Map(factions.map((faction) => [faction.slug.toLowerCase(), faction]));
    const fallbackRarity = typeof fallbackRarityId === "string" && fallbackRarityId
      ? rarityById.get(fallbackRarityId)
      : undefined;

    if (typeof fallbackRarityId === "string" && fallbackRarityId && !fallbackRarity) {
      return { status: "error", message: t("fallbackRarityMissing"), imported: 0, skipped: rowCount, issues: [] };
    }

    const existingNumbers = new Set(
      existingCards
        .filter((card) => card.seasonId === seasonId)
        .map((card) => card.number),
    );
    const seenNumbers = new Set<number>();
    const takenSlugs = new Set(existingCards.map((card) => card.slug));
    const issues: CardImportIssue[] = [];
    const candidates: Array<{ id: string; data: CreateCardInput }> = [];
    let skipped = 0;
    const firestore = getFirebaseAdminFirestore();
    const collection = firestore.collection(FIRESTORE_COLLECTIONS.cards);

    for (const [index, rawRow] of rows.entries()) {
      const row = index + 1;
      const parsed = cardJsonImportRowSchema.safeParse(rawRow);
      const rawCard = rawRow && typeof rawRow === "object" ? rawRow as Record<string, unknown> : {};
      const cardLabel = typeof rawCard.name === "string"
        ? rawCard.name
        : typeof rawCard.number === "number"
          ? `#${rawCard.number}`
          : t("unknownCard");

      if (!parsed.success) {
        skipped += 1;
        const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "JSON")))];
        addIssue(issues, { row, card: cardLabel, message: t("issueInvalid", { fields: fields.join(", ") }) });
        continue;
      }

      const source = parsed.data;
      if (existingNumbers.has(source.number) || seenNumbers.has(source.number)) {
        skipped += 1;
        addIssue(issues, { row, card: source.name, message: t("issueDuplicateNumber", { number: source.number }) });
        continue;
      }

      const rarity = source.rarity_slug
        ? rarityBySlug.get(source.rarity_slug.toLowerCase())
        : fallbackRarity;
      if (!rarity) {
        skipped += 1;
        addIssue(issues, {
          row,
          card: source.name,
          message: source.rarity_slug
            ? t("issueUnknownRarity", { slug: source.rarity_slug })
            : t("issueMissingRarity"),
        });
        continue;
      }

      const unknownTypeSlugs = source.type_slugs.filter((slug) => !typeBySlug.has(slug.toLowerCase()));
      if (unknownTypeSlugs.length > 0) {
        skipped += 1;
        addIssue(issues, { row, card: source.name, message: t("issueUnknownTypes", { slugs: unknownTypeSlugs.join(", ") }) });
        continue;
      }

      const factionSlugs = [...new Set([
        ...(source.faction_slug ? [source.faction_slug] : []),
        ...(source.faction_slugs ?? []),
      ].map((slug) => slug.toLowerCase()))];
      const unknownFactionSlugs = factionSlugs.filter((slug) => !factionBySlug.has(slug));
      if (unknownFactionSlugs.length > 0) {
        skipped += 1;
        addIssue(issues, { row, card: source.name, message: t("issueUnknownFactions", { slugs: unknownFactionSlugs.join(", ") }) });
        continue;
      }

      const id = collection.doc().id;
      const data = createCardSchema.safeParse({
        number: source.number,
        slug: availableSlug(source.name, takenSlugs),
        seasonId,
        setId: null,
        rarityId: rarity.id,
        typeIds: [...new Set(source.type_slugs.map((slug) => typeBySlug.get(slug.toLowerCase())!.id))],
        gameplayKind: source.is_commander ? "commander" : "combatant",
        factionIds: factionSlugs.map((slug) => factionBySlug.get(slug)!.id),
        attack: source.attack,
        value: source.value,
        defense: source.defense,
        isCommander: source.is_commander,
        isPromo: false,
        isFeatured: false,
        translations: { fr: { name: source.name, description: source.description } },
        artwork: {
          id: "main",
          storagePath: `external/cards/${id}/main`,
          url: source.image_url,
          orientation: "vertical",
          order: 0,
          isPrimary: true,
          translations: { fr: { name: source.name, alt: source.name } },
        },
        alternativeArtworks: [],
      });

      if (!data.success) {
        skipped += 1;
        addIssue(issues, { row, card: source.name, message: t("issueInvalid", { fields: data.error.issues.map((issue) => issue.path.join(".")).join(", ") }) });
        continue;
      }

      seenNumbers.add(source.number);
      candidates.push({ id, data: data.data });
    }

    if (candidates.length === 0) {
      return { status: "error", message: t("nothingImported"), imported: 0, skipped, issues };
    }

    const snapshots = await buildCardDisplaySnapshots(candidates.map(({ data }) => data));
    const batch = firestore.batch();
    candidates.forEach(({ id, data }, index) => {
      batch.create(collection.doc(id), {
        ...data,
        display: snapshots[index],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    try {
      updateTag(CODEX_CACHE_TAGS.cards);
      candidates.forEach(({ data }) => updateTag(CODEX_CACHE_TAGS.card(data.slug)));
      revalidatePath("/[locale]/admin", "page");
      revalidatePath("/[locale]/admin/cards", "page");
    } catch (cacheError) {
      console.error("Card import cache invalidation failed", cacheError);
    }

    return {
      status: "success",
      message: t("success", { imported: candidates.length, skipped }),
      imported: candidates.length,
      skipped,
      issues,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== "UNAUTHORIZED") console.error("Card JSON import failed", error);
    return {
      status: "error",
      message: message === "UNAUTHORIZED" ? t("sessionExpired") : t("serviceError"),
      imported: 0,
      skipped: rowCount,
      issues: [],
    };
  }
}
