import { z } from "zod";

import { MAX_CARD_STAT } from "@/features/cards/constants";

export const MAX_CARD_IMPORT_ROWS = 400;
export const MAX_CARD_IMPORT_BYTES = 5 * 1024 * 1024;

const optionalSlug = z.string().trim().min(1).max(160).nullable().optional();

export const cardJsonImportRowSchema = z
  .object({
    number: z.number().int().nonnegative(),
    name: z.string().trim().min(1).max(500),
    rarity_slug: optionalSlug,
    type_slugs: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
    faction_slug: optionalSlug,
    faction_slugs: z
      .array(z.string().trim().min(1).max(160))
      .max(20)
      .optional(),
    attack: z.number().int().min(0).max(MAX_CARD_STAT),
    value: z.number().int().min(0).max(MAX_CARD_STAT),
    defense: z.number().int().min(0).max(MAX_CARD_STAT),
    description: z.string().trim().max(10_000).default(""),
    is_commander: z.boolean().default(false),
    image_url: z
      .url()
      .refine((value) => new URL(value).protocol === "https:", {
        message: "The image URL must use HTTPS.",
      }),
  })
  .passthrough();

export type CardJsonImportRow = z.infer<typeof cardJsonImportRowSchema>;

export function parseCardJsonImportText(text: string): unknown[] {
  const parsed: unknown = JSON.parse(text);

  if (!Array.isArray(parsed)) {
    throw new Error("JSON_ARRAY_REQUIRED");
  }
  if (parsed.length === 0) {
    throw new Error("JSON_EMPTY");
  }
  if (parsed.length > MAX_CARD_IMPORT_ROWS) {
    throw new Error("JSON_TOO_MANY_ROWS");
  }

  return parsed;
}

export interface CardImportIssue {
  row: number;
  card: string;
  message: string;
}

export interface CardImportActionState {
  status: "idle" | "success" | "error";
  message?: string;
  imported: number;
  skipped: number;
  issues: CardImportIssue[];
}

export const INITIAL_CARD_IMPORT_STATE: CardImportActionState = {
  status: "idle",
  imported: 0,
  skipped: 0,
  issues: [],
};
