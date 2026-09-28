import { Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createVerificationPageUrl,
  sendVerificationEmail,
} from "@/lib/email/verification-email";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

const RESEND_DELAY_MS = 60_000;

const requestSchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
});

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

export async function POST(request: Request) {
  try {
    const idToken = bearerToken(request);
    if (!idToken) {
      return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { locale } = requestSchema.parse(await request.json());
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(idToken, true);
    const user = await auth.getUser(decoded.uid);

    if (!user.email) {
      return NextResponse.json({ code: "EMAIL_REQUIRED" }, { status: 400 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const firestore = getFirebaseAdminFirestore();
    const requestReference = firestore
      .collection("authVerificationEmailRequests")
      .doc(decoded.uid);
    const now = Timestamp.now();
    let retryAfterSeconds = 0;

    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(requestReference);
      const lastSentAt = snapshot.get("lastSentAt");

      if (lastSentAt instanceof Timestamp) {
        const elapsed = now.toMillis() - lastSentAt.toMillis();
        if (elapsed < RESEND_DELAY_MS) {
          retryAfterSeconds = Math.ceil((RESEND_DELAY_MS - elapsed) / 1000);
          return;
        }
      }

      transaction.set(
        requestReference,
        { lastSentAt: now },
        { merge: true },
      );
    });

    if (retryAfterSeconds > 0) {
      return NextResponse.json(
        { code: "VERIFICATION_RATE_LIMITED", retryAfterSeconds },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }

    const firebaseVerificationUrl = await auth.generateEmailVerificationLink(user.email);
    const verificationUrl = createVerificationPageUrl(firebaseVerificationUrl, locale);
    await sendVerificationEmail({
      email: user.email,
      locale,
      verificationUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
    }

    console.error("Verification email delivery failed", error);
    return NextResponse.json(
      { code: "VERIFICATION_EMAIL_FAILED" },
      { status: 502 },
    );
  }
}
