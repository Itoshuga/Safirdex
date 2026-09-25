import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  USER_SESSION_COOKIE,
  USER_SESSION_MAX_AGE,
} from "@/lib/auth/user-session";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";

const requestSchema = z.object({
  idToken: z.string().min(1),
  displayName: z.string().trim().min(2).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    const user = await auth.getUser(decoded.uid);
    const displayName = body.displayName ?? user.displayName ?? null;
    const email = user.email ?? decoded.email ?? null;
    const profileRef = getFirebaseAdminFirestore()
      .collection("users")
      .doc(decoded.uid);
    const profile = await profileRef.get();
    const now = FieldValue.serverTimestamp();

    await profileRef.set(
      {
        email,
        displayName,
        emailVerified: user.emailVerified,
        updatedAt: now,
        lastLoginAt: now,
        ...(profile.exists ? {} : { createdAt: now }),
      },
      { merge: true },
    );

    const sessionCookie = await auth.createSessionCookie(body.idToken, {
      expiresIn: USER_SESSION_MAX_AGE * 1000,
    });
    const response = NextResponse.json({ ok: true });

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

