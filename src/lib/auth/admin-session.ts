import "server-only";

import { hasAdminClaim } from "@/lib/auth/claims";
import { getUserSession } from "@/lib/auth/user-session";

export async function getAdminSession() {
  const session = await getUserSession();
  return session && hasAdminClaim(session) ? session : null;
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}
