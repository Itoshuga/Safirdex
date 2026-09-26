import { z } from "zod";

export const deckVisibilitySchema = z.enum(["private", "unlisted", "public"]);

export const deckBuilderDraftSchema = z.object({
  deckId: z.string().trim().min(1).max(128).optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2_000).default(""),
  visibility: deckVisibilitySchema,
  commanderId: z.string().trim().min(1).max(128).nullable(),
  entries: z
    .array(
      z.object({
        cardId: z.string().trim().min(1).max(128),
        quantity: z.number().int().min(1).max(40),
      }),
    )
    .max(40)
    .refine(
      (entries) => new Set(entries.map((entry) => entry.cardId)).size === entries.length,
      { message: "A card may only have one deck entry." },
    ),
});

export const saveDeckPayloadSchema = z.object({
  draft: deckBuilderDraftSchema,
  intent: z.enum(["draft", "publish"]),
});
