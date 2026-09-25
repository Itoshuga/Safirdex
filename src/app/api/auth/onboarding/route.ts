import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ensureUserProfile,
  normalizePublicName,
} from "@/lib/auth/user-profile";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";

const initializeSchema = z.object({
  action: z.literal("initialize"),
  idToken: z.string().min(1),
});

const completeSchema = z.object({
  action: z.literal("complete"),
  idToken: z.string().min(1),
  pseudonym: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[\p{L}\p{N}._-]+$/u),
  displayName: z.string().trim().min(2).max(40),
});

const requestSchema = z.discriminatedUnion("action", [
  initializeSchema,
  completeSchema,
]);

class PublicNameConflict extends Error {
  constructor(public readonly code: "PSEUDONYM_TAKEN" | "DISPLAY_NAME_TAKEN") {
    super(code);
  }
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    const account = await ensureUserProfile(decoded);

    if (body.action === "initialize") {
      return NextResponse.json({
        ok: true,
        emailVerified: account.user.emailVerified,
        onboardingCompleted: account.profile.onboardingCompleted === true,
      });
    }

    if (!account.user.emailVerified) {
      return NextResponse.json(
        { code: "EMAIL_NOT_VERIFIED", message: "L’adresse e-mail doit être vérifiée." },
        { status: 403 },
      );
    }

    const pseudonym = body.pseudonym.trim();
    const displayName = body.displayName.trim();
    const pseudonymKey = normalizePublicName(pseudonym);
    const displayNameKey = normalizePublicName(displayName);

    if (!pseudonymKey || !displayNameKey) {
      return NextResponse.json(
        { code: "INVALID_PUBLIC_NAME", message: "Ces informations ne sont pas valides." },
        { status: 400 },
      );
    }

    const firestore = getFirebaseAdminFirestore();
    const pseudonymRef = firestore.collection("pseudonyms").doc(pseudonymKey);
    const displayNameRef = firestore
      .collection("displayNames")
      .doc(displayNameKey);

    await firestore.runTransaction(async (transaction) => {
      const [profileSnapshot, pseudonymSnapshot, displayNameSnapshot] =
        await Promise.all([
          transaction.get(account.profileRef),
          transaction.get(pseudonymRef),
          transaction.get(displayNameRef),
        ]);
      const profile = profileSnapshot.data() as
        | (typeof account.profile & {
            pseudonymKey?: string | null;
            displayNameKey?: string | null;
          })
        | undefined;

      if (
        pseudonymSnapshot.exists &&
        pseudonymSnapshot.get("uid") !== decoded.uid
      ) {
        throw new PublicNameConflict("PSEUDONYM_TAKEN");
      }
      if (
        displayNameSnapshot.exists &&
        displayNameSnapshot.get("uid") !== decoded.uid
      ) {
        throw new PublicNameConflict("DISPLAY_NAME_TAKEN");
      }

      if (profile?.pseudonymKey && profile.pseudonymKey !== pseudonymKey) {
        transaction.delete(
          firestore.collection("pseudonyms").doc(profile.pseudonymKey),
        );
      }
      if (profile?.displayNameKey && profile.displayNameKey !== displayNameKey) {
        transaction.delete(
          firestore.collection("displayNames").doc(profile.displayNameKey),
        );
      }

      const reservation = {
        uid: decoded.uid,
        updatedAt: FieldValue.serverTimestamp(),
      };
      transaction.set(pseudonymRef, { ...reservation, pseudonym });
      transaction.set(displayNameRef, { ...reservation, displayName });
      transaction.set(
        account.profileRef,
        {
          pseudonym,
          pseudonymKey,
          displayName,
          displayNameKey,
          emailVerified: true,
          onboardingCompleted: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    await auth.updateUser(decoded.uid, { displayName });
    const refreshedUser = await auth.getUser(decoded.uid);
    await auth.setCustomUserClaims(decoded.uid, {
      ...(refreshedUser.customClaims ?? {}),
      onboardingCompleted: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PublicNameConflict) {
      return NextResponse.json(
        { code: error.code },
        { status: 409 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "Les informations sont incomplètes." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { code: "ONBOARDING_FAILED", message: "Le profil n’a pas pu être enregistré." },
      { status: 401 },
    );
  }
}
