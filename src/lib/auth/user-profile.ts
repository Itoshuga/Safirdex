import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";

import { hasAdminClaim } from "@/lib/auth/claims";
import type { AppLocale } from "@/lib/i18n/locales";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";

export interface StoredUserProfile {
  email: string | null;
  emailVerified: boolean;
  pseudonym: string | null;
  pseudonymKey: string | null;
  displayName: string | null;
  displayNameKey: string | null;
  role: "user" | "admin";
  roles: string[];
  onboardingCompleted: boolean;
  preferredLocale: AppLocale | null;
}

function uniqueRoles(value: unknown, isAdmin: boolean) {
  const existing = Array.isArray(value)
    ? value.filter((role): role is string => typeof role === "string")
    : [];

  return Array.from(
    new Set(["user", ...existing, ...(isAdmin ? ["admin"] : [])]),
  );
}

export async function ensureUserProfile(decoded: DecodedIdToken) {
  const auth = getFirebaseAdminAuth();
  const user = await auth.getUser(decoded.uid);
  const customClaims = user.customClaims ?? {};
  const isAdmin = hasAdminClaim({ ...decoded, ...customClaims });
  const roles = uniqueRoles(customClaims.roles, isAdmin);
  const role = isAdmin ? "admin" : "user";

  if (
    customClaims.role !== role ||
    JSON.stringify(customClaims.roles) !== JSON.stringify(roles)
  ) {
    await auth.setCustomUserClaims(user.uid, {
      ...customClaims,
      role,
      roles,
    });
  }

  const profileRef = getFirebaseAdminFirestore()
    .collection("users")
    .doc(user.uid);
  const snapshot = await profileRef.get();
  const now = FieldValue.serverTimestamp();

  if (!snapshot.exists) {
    await profileRef.set({
      email: user.email ?? decoded.email ?? null,
      emailVerified: user.emailVerified,
      pseudonym: null,
      pseudonymKey: null,
      displayName: null,
      displayNameKey: null,
      role,
      roles,
      onboardingCompleted: false,
      preferredLocale: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });
  } else {
    const existing = snapshot.data() as Partial<StoredUserProfile>;
    await profileRef.set(
      {
        email: user.email ?? decoded.email ?? null,
        emailVerified: user.emailVerified,
        pseudonym: existing.pseudonym ?? null,
        pseudonymKey: existing.pseudonymKey ?? null,
        displayName: existing.displayName ?? null,
        displayNameKey: existing.displayNameKey ?? null,
        role,
        roles,
        onboardingCompleted: existing.onboardingCompleted === true,
        preferredLocale: existing.preferredLocale ?? null,
        createdAt: snapshot.get("createdAt") ?? now,
        lastLoginAt: snapshot.get("lastLoginAt") ?? null,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  const refreshed = await profileRef.get();

  return {
    user,
    profileRef,
    profile: refreshed.data() as StoredUserProfile,
    isAdmin,
    role,
    roles,
  };
}

export function normalizePublicName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
