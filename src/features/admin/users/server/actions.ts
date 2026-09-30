"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import type { AdminActionState } from "@/features/admin/action-state";
import { updateModeratedUser } from "@/features/admin/users/server/user-moderation-service";
import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import {
  bioSchema,
  displayNameSchema,
  usernameSchema,
} from "@/validation/community";

const moderatedUserSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: bioSchema,
  role: z.enum(["user", "admin"]),
});

export async function updateModeratedUserAction(
  userId: string,
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = await getTranslations("Admin.users.feedback");
  const parsed = moderatedUserSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: t("invalid"),
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).flatMap(
          ([key, messages]) => messages?.length ? [[key, t("invalid")]] : [],
        ),
      ),
    };
  }

  try {
    const result = await updateModeratedUser(userId, parsed.data);
    updateTag(COMMUNITY_CACHE_TAGS.profiles);
    updateTag(COMMUNITY_CACHE_TAGS.profile(result.usernameNormalized));
    updateTag(COMMUNITY_CACHE_TAGS.profile(result.previousUsernameNormalized));
    revalidatePath("/[locale]/admin/users", "page");
    revalidatePath("/[locale]/admin/users/[id]", "page");
    revalidatePath("/[locale]/user/[username]", "page");
    revalidatePath("/[locale]/account", "page");
    return { status: "success", message: t("updated") };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "USERNAME_TAKEN") {
      return {
        status: "error",
        message: t("usernameTaken"),
        fieldErrors: { username: t("usernameTaken") },
      };
    }
    if (code === "UNAUTHORIZED") {
      return { status: "error", message: t("unauthorized") };
    }
    return { status: "error", message: t("failed") };
  }
}
