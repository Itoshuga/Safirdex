import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  USER_SESSION_COOKIE,
  USER_SESSION_MAX_AGE,
} from "@/lib/auth/user-session";
import { ensureUserProfile } from "@/lib/auth/user-profile";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

const requestSchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    const account = await ensureUserProfile(decoded);

    if (!account.user.emailVerified || decoded.email_verified !== true) {
      return NextResponse.json(
        { code: "EMAIL_NOT_VERIFIED" },
        { status: 403 },
      );
    }

    if (
      account.profile.onboardingCompleted !== true ||
      decoded.onboardingCompleted !== true
    ) {
      return NextResponse.json(
        { code: "ONBOARDING_REQUIRED" },
        { status: 409 },
      );
    }

    await account.profileRef.set(
      {
        emailVerified: true,
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const sessionCookie = await auth.createSessionCookie(body.idToken, {
      expiresIn: USER_SESSION_MAX_AGE * 1000,
    });
    const response = NextResponse.json({ ok: true, isAdmin: account.isAdmin });

    response.cookies.set(USER_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: USER_SESSION_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Impossible de créer une session sécurisée." },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
