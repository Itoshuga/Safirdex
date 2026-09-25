import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";

import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const USER_SESSION_COOKIE = "safirdex_user_session";
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export async function getUserSession(): Promise<DecodedIdToken | null> {
  const sessionCookie = (await cookies()).get(USER_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
  } catch {
    return null;
  }
}

