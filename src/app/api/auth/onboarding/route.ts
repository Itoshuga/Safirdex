import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureUserProfile } from "@/lib/auth/user-profile";
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
    .regex(/^[a-zA-Z0-9._-]+$/),
  displayName: z.string().trim().min(2).max(40),
});

const requestSchema = z.discriminatedUnion("action", [
  initializeSchema,
  completeSchema,
]);

class PublicNameConflict extends Error {
  constructor(public readonly code: "PSEUDONYM_TAKEN") {
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
    const pseudonymKey = pseudonym.toLowerCase();
    const displayNameKey = displayName.toLocaleLowerCase();

    if (!pseudonymKey || !displayNameKey) {
      return NextResponse.json(
        { code: "INVALID_PUBLIC_NAME", message: "Ces informations ne sont pas valides." },
        { status: 400 },
      );
    }

    const firestore = getFirebaseAdminFirestore();
    const usernameRef = firestore.collection("usernames").doc(pseudonymKey);
    const publicProfileRef = firestore.collection("publicProfiles").doc(decoded.uid);

    await firestore.runTransaction(async (transaction) => {
      const [profileSnapshot, usernameSnapshot, publicProfileSnapshot] =
        await Promise.all([
          transaction.get(account.profileRef),
          transaction.get(usernameRef),
          transaction.get(publicProfileRef),
        ]);
      if (
        usernameSnapshot.exists &&
        ((usernameSnapshot.get("userId") as string | undefined) ??
          (usernameSnapshot.get("uid") as string | undefined)) !== decoded.uid
      ) {
        throw new PublicNameConflict("PSEUDONYM_TAKEN");
      }
      transaction.set(
        usernameRef,
        {
          userId: decoded.uid,
          username: pseudonym,
          currentUsernameNormalized: pseudonymKey,
          isAlias: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      if (!publicProfileSnapshot.exists) {
        transaction.create(publicProfileRef, {
          username: pseudonym,
          usernameNormalized: pseudonymKey,
          displayName,
          displayNameNormalized: displayName
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase()
            .trim()
            .replace(/\s+/g, " "),
          bio: "",
          joinedAt: profileSnapshot.get("createdAt") ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          stats: {
            followersCount: 0,
            followingCount: 0,
            decksCount: 0,
            collectionCardsCount: 0,
          },
          visibility: {
            publicProfile: true,
            decks: "public",
            collection: "private",
            activity: "public",
          },
        });
      }
      transaction.set(
        account.profileRef,
        {
          username: pseudonym,
          usernameNormalized: pseudonymKey,
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
