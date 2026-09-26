import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9._-]+$/);

export const displayNameSchema = z.string().trim().min(2).max(40);
export const bioSchema = z.string().trim().max(280);

const optionalAssetUrl = z.union([z.url().max(2_048), z.literal("")]);
const optionalStoragePath = z.union([
  z.string().trim().max(1_024).regex(/^users\/[a-zA-Z0-9_-]+\/(avatar|banner)\.webp$/),
  z.literal(""),
]);

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: bioSchema,
  avatarUrl: optionalAssetUrl.optional().default(""),
  avatarStoragePath: optionalStoragePath.optional().default(""),
  bannerUrl: optionalAssetUrl.optional().default(""),
  bannerStoragePath: optionalStoragePath.optional().default(""),
});

export const privacyUpdateSchema = z.object({
  publicProfile: z.boolean(),
  decks: z.enum(["public", "private"]),
  collection: z.enum(["public", "private"]),
  activity: z.enum(["public", "private"]),
});

export const followTargetSchema = usernameSchema.transform((value) =>
  value.toLowerCase(),
);

