"use server";

import { cookies } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";

import { deleteSafirdexAccount } from "@/features/account/server/delete-account";
import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import {
  assertApplicationAvailable,
  MAINTENANCE_UNAVAILABLE_CODE,
} from "@/features/maintenance/server/maintenance-service";
import { getUserSession, USER_SESSION_COOKIE } from "@/lib/auth/user-session";

export async function deleteAccountAction(confirmation: string) {
  const session = await getUserSession();
  if (!session) return { ok: false, code: "AUTH_REQUIRED" } as const;
  try {
    await assertApplicationAvailable({ session });
  } catch {
    return { ok: false, code: MAINTENANCE_UNAVAILABLE_CODE } as const;
  }
  const authenticatedAt = Number(session.auth_time ?? 0);
  if (!authenticatedAt || Math.floor(Date.now() / 1_000) - authenticatedAt > 5 * 60) {
    return { ok: false, code: "RECENT_LOGIN_REQUIRED" } as const;
  }

  try {
    const deleted = await deleteSafirdexAccount(session.uid, confirmation);
    updateTag(COMMUNITY_CACHE_TAGS.profiles);
    updateTag(COMMUNITY_CACHE_TAGS.discover);
    if (deleted.usernameNormalized) {
      updateTag(COMMUNITY_CACHE_TAGS.profile(deleted.usernameNormalized));
    }
    revalidatePath("/[locale]/community", "page");
    revalidatePath("/[locale]/user/[username]", "page");
    (await cookies()).delete(USER_SESSION_COOKIE);
    return { ok: true } as const;
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error && error.message === "CONFIRMATION_MISMATCH"
        ? "CONFIRMATION_MISMATCH"
        : "DELETE_FAILED",
    } as const;
  }
}
