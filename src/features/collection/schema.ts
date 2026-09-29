import { z } from "zod";

import { MAX_OWNED_QUANTITY } from "@/features/collection/domain";

export const collectionCardIdSchema = z.string().trim().min(1).max(200);

export const collectionQuantitySchema = z.object({
  cardId: collectionCardIdSchema,
  quantity: z.number().int().min(0).max(MAX_OWNED_QUANTITY),
});

export const collectionAdjustmentSchema = z.object({
  cardId: collectionCardIdSchema,
  delta: z.union([z.literal(-1), z.literal(1)]),
});

export const tradeQuantitySchema = collectionQuantitySchema;
export const tradeAdjustmentSchema = collectionAdjustmentSchema;

export const tradePrivacySettingsSchema = z.object({
  showTradesPublicly: z.boolean(),
  showDiscordForTrades: z.boolean(),
  discord: z
    .string()
    .trim()
    .max(64)
    .regex(/^[\p{L}\p{N}_.-]*$/u),
});
