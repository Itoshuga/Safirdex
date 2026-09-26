import { z } from "zod";

import {
  entityFieldsSchema,
  nonEmptyUpdate,
  requiredStringSchema,
  slugSchema,
  storagePathSchema,
  timestampSchema,
  translationsSchema,
} from "@/validation/shared";

export const nameDescriptionTranslationSchema = z.object({
  name: requiredStringSchema,
  description: z.string().trim().max(10_000).optional(),
});

export const requiredNameDescriptionTranslationSchema = z.object({
  name: requiredStringSchema,
  description: z.string().trim().max(10_000),
});

export const artworkTranslationSchema = z
  .object({
    name: z.string().trim().max(500).optional(),
    alt: z.string().trim().max(1_000).optional(),
  })
  .refine((translation) => translation.name || translation.alt, {
    message: "An artwork translation needs a name or alt text.",
  });

export const cardOrientationSchema = z.enum(["vertical", "horizontal"]);

export const storedAssetSchema = z.object({
  storagePath: storagePathSchema,
  url: z.url().optional(),
});

export const cardArtworkSchema = z.object({
  id: requiredStringSchema,
  storagePath: storagePathSchema,
  url: z.url().optional(),
  orientation: cardOrientationSchema,
  order: z.number().int().nonnegative().optional(),
  isPrimary: z.boolean().optional(),
  translations: translationsSchema(artworkTranslationSchema).optional(),
});

const displayNameTranslationsSchema = translationsSchema(
  z.object({ name: requiredStringSchema }),
);

const cardDisplayEntitySchema = z.object({
  id: requiredStringSchema,
  slug: slugSchema,
  translations: displayNameTranslationsSchema,
});

const cardDisplayVisualEntitySchema = cardDisplayEntitySchema.extend({
  visual: z
    .object({
      color: z.string().trim().max(32).optional(),
      iconUrl: z.url().optional(),
    })
    .optional(),
});

export const cardDisplaySnapshotSchema = z.object({
  season: cardDisplayEntitySchema,
  set: cardDisplayEntitySchema.optional(),
  rarity: cardDisplayVisualEntitySchema.extend({
    order: z.number().int().nonnegative(),
  }),
  types: z.array(cardDisplayVisualEntitySchema).max(20),
});

export const cardStatSchema = z.number().int().min(0).max(9);

export const createCardSchema = z.object({
  number: z.number().int().nonnegative(),
  slug: slugSchema,
  seasonId: requiredStringSchema,
  setId: requiredStringSchema.nullable(),
  rarityId: requiredStringSchema,
  typeIds: z.array(requiredStringSchema).max(20),
  gameplayKind: z
    .enum(["combatant", "spell", "token", "commander"])
    .default("combatant"),
  factionIds: z.array(requiredStringSchema).max(20).default([]),
  attack: cardStatSchema,
  value: cardStatSchema,
  defense: cardStatSchema,
  isCommander: z.boolean(),
  isPromo: z.boolean(),
  isFeatured: z.boolean(),
  translations: translationsSchema(requiredNameDescriptionTranslationSchema),
  artwork: cardArtworkSchema,
  alternativeArtworks: z.array(cardArtworkSchema).max(30),
  display: cardDisplaySnapshotSchema.optional(),
});

export const updateCardSchema = nonEmptyUpdate(createCardSchema);

export const cardSchema = createCardSchema.extend(entityFieldsSchema.shape);

export const createSeasonSchema = z.object({
  slug: slugSchema,
  number: z.number().int().positive(),
  translations: translationsSchema(nameDescriptionTranslationSchema),
  artwork: storedAssetSchema.optional(),
  releaseDate: timestampSchema.nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export const updateSeasonSchema = nonEmptyUpdate(createSeasonSchema);

export const seasonSchema = createSeasonSchema.extend(entityFieldsSchema.shape);

export const createCardSetSchema = z.object({
  seasonId: requiredStringSchema,
  slug: slugSchema,
  code: z.string().trim().min(1).max(32).optional(),
  translations: translationsSchema(nameDescriptionTranslationSchema),
  releaseDate: timestampSchema.nullable(),
});

export const updateCardSetSchema = nonEmptyUpdate(createCardSetSchema);

export const cardSetSchema = createCardSetSchema.extend(
  entityFieldsSchema.shape,
);

const visualSchema = z.object({
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{3,8}$/, "Use a hexadecimal color.")
    .optional(),
  iconStoragePath: storagePathSchema.optional(),
  iconUrl: z.url().optional(),
});

export const createRaritySchema = z.object({
  slug: slugSchema,
  translations: translationsSchema(nameDescriptionTranslationSchema),
  order: z.number().int().nonnegative(),
  visual: visualSchema.optional(),
});

export const updateRaritySchema = nonEmptyUpdate(createRaritySchema);

export const raritySchema = createRaritySchema.extend(entityFieldsSchema.shape);

export const createCardTypeSchema = z.object({
  slug: slugSchema,
  translations: translationsSchema(nameDescriptionTranslationSchema),
  visual: visualSchema.optional(),
});

export const updateCardTypeSchema = nonEmptyUpdate(createCardTypeSchema);

export const cardTypeSchema = createCardTypeSchema.extend(
  entityFieldsSchema.shape,
);

export const createFactionSchema = z.object({
  slug: slugSchema,
  visual: visualSchema.optional(),
  translations: translationsSchema(nameDescriptionTranslationSchema),
});

export const updateFactionSchema = nonEmptyUpdate(createFactionSchema);

export const factionSchema = createFactionSchema.extend(entityFieldsSchema.shape);

export const glossaryKeySchema = slugSchema;

export const glossaryTranslationSchema = z.object({
  label: requiredStringSchema,
  definition: z.string().trim().min(1).max(10_000),
});

export const createGlossaryEntrySchema = z.object({
  key: glossaryKeySchema,
  slug: slugSchema,
  translations: translationsSchema(glossaryTranslationSchema),
});

export const updateGlossaryEntrySchema = nonEmptyUpdate(
  createGlossaryEntrySchema,
);

export const glossaryEntrySchema = createGlossaryEntrySchema.extend(
  entityFieldsSchema.shape,
);
