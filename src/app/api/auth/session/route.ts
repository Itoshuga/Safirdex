import { NextResponse } from "next/server";
import { z } from "zod";

import { hasAdminClaim } from "@/lib/auth/claims";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from "@/lib/auth/admin-session";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

const requestSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);

    if (!hasAdminClaim(decoded)) {
      return NextResponse.json(
        { message: "This account does not have administrator access." },
        { status: 403 },
      );
    }

    const sessionCookie = await auth.createSessionCookie(body.idToken, {
      expiresIn: ADMIN_SESSION_MAX_AGE * 1000,
    });
    const response = NextResponse.json({ ok: true });

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to create a secure administrator session." },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
