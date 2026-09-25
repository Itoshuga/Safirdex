import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";

import { hasAdminClaim } from "@/lib/auth/claims";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const ADMIN_SESSION_COOKIE = "safir_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function getAdminSession(): Promise<DecodedIdToken | null> {
  const sessionCookie = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );

    return hasAdminClaim(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}
