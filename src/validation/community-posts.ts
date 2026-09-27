import { z } from "zod";

export const COMMUNITY_POST_MAX_LENGTH = 500;

export const communityPostAttachmentInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("card"), id: z.string().trim().min(1).max(128) }),
  z.object({ type: z.literal("deck"), id: z.string().trim().min(1).max(128) }),
  z.object({ type: z.literal("collection"), id: z.literal("self") }),
]);

export const createCommunityPostSchema = z.object({
  content: z.string().trim().max(COMMUNITY_POST_MAX_LENGTH),
  visibility: z.enum(["public", "followers"]),
  attachment: communityPostAttachmentInputSchema.nullable().optional(),
}).refine((value) => value.content.length > 0 || Boolean(value.attachment), {
  message: "EMPTY_POST",
  path: ["content"],
});

export const communityPostIdSchema = z.string().trim().min(1).max(128);

export type CreateCommunityPostInput = z.infer<typeof createCommunityPostSchema>;
