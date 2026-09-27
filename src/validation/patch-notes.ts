import { z } from "zod";

import { getPatchNoteVideoEmbed, isSafePatchNoteLink } from "../features/patch-notes/video.ts";

const id = z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
const richTextNodeSchema = z.object({
  text: z.string().max(10_000),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  code: z.boolean().optional(),
  href: z.string().trim().max(2_048).refine(isSafePatchNoteLink, "INVALID_LINK").optional(),
  break: z.boolean().optional(),
});
const richTextSchema = z.array(richTextNodeSchema).max(500);
const editorImageSchema = z.object({
  id,
  storagePath: z.string().trim().max(500).optional(),
  url: z.string().trim().url().max(2_048).optional(),
  width: z.number().int().positive().max(10_000).optional(),
  height: z.number().int().positive().max(10_000).optional(),
});
const layout = z.enum(["default", "wide"]);

export const patchNoteBlockSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: z.string().trim().max(180) }),
  z.object({ id, type: z.literal("paragraph"), content: richTextSchema }),
  z.object({ id, type: z.literal("image"), image: editorImageSchema, alt: z.string().trim().max(300), caption: z.string().trim().max(500).optional(), layout }),
  z.object({ id, type: z.literal("gallery"), images: z.array(editorImageSchema.extend({ alt: z.string().trim().max(300), caption: z.string().trim().max(500).optional() })).max(12), layout }),
  z.object({ id, type: z.literal("video"), url: z.string().trim().max(2_048).refine((value) => Boolean(getPatchNoteVideoEmbed(value)), "INVALID_VIDEO"), caption: z.string().trim().max(500).optional(), layout }),
  z.object({ id, type: z.literal("list"), ordered: z.boolean(), items: z.array(z.string().trim().min(1).max(1_000)).max(100) }),
  z.object({ id, type: z.literal("callout"), variant: z.enum(["info", "success", "warning", "important"]), title: z.string().trim().max(120).optional(), content: richTextSchema }),
  z.object({ id, type: z.literal("quote"), text: z.string().trim().max(2_000), author: z.string().trim().max(120).optional() }),
  z.object({ id, type: z.literal("divider") }),
]);

const translationSchema = z.object({
  title: z.string().trim().max(180),
  excerpt: z.string().trim().max(500),
  blocks: z.array(patchNoteBlockSchema).max(100),
});

export const patchNoteEditorSchema = z.object({
  slug: z.string().trim().max(180).regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.string().trim().max(80),
  category: z.enum(["update", "feature", "announcement", "maintenance"]),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  scheduledAt: z.string().trim().max(40),
  coverImage: editorImageSchema.extend({ alt: z.record(z.string(), z.string().trim().max(300)) }).optional(),
  translations: z.object({ fr: translationSchema, en: translationSchema }),
});

export type PatchNoteEditorInput = z.infer<typeof patchNoteEditorSchema>;
