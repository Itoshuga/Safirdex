import { loadEnvConfig } from "@next/env";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

loadEnvConfig(process.cwd());

const isDryRun = process.argv.includes("--dry-run");
const allowLiveProject = process.argv.includes("--allow-live");
const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function normalizeLegacyUsername(value: string, userId: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 24);
  return normalized.length >= 3 ? normalized : `user-${userId.slice(0, 12)}`;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  if (!isEmulator && !allowLiveProject) {
    throw new Error(
      "Refusing to migrate a live Firebase project. Pass --allow-live explicitly.",
    );
  }

  const { getFirebaseAdminFirestore } = await import("@/lib/firebase/admin");
  const firestore = getFirebaseAdminFirestore();
  const users = await firestore.collection("users").get();
  let created = 0;
  let skipped = 0;
  const conflicts: string[] = [];

  for (const userDocument of users.docs) {
    const data = userDocument.data();
    const rawUsername = String(data.username ?? data.pseudonym ?? "").trim();
    if (!rawUsername) {
      skipped += 1;
      continue;
    }
    const usernameNormalized = normalizeLegacyUsername(rawUsername, userDocument.id);
    const username = /^[a-zA-Z0-9._-]{3,24}$/.test(rawUsername)
      ? rawUsername
      : usernameNormalized;
    const profileRef = firestore.collection("publicProfiles").doc(userDocument.id);
    const usernameRef = firestore.collection("usernames").doc(usernameNormalized);

    if (isDryRun) {
      const [profile, reservation] = await Promise.all([
        profileRef.get(),
        usernameRef.get(),
      ]);
      const reservedUserId = reservation.get("userId") ?? reservation.get("uid");
      if (reservation.exists && reservedUserId !== userDocument.id) {
        conflicts.push(`${userDocument.id}: @${usernameNormalized}`);
      } else if (profile.exists) {
        skipped += 1;
      } else {
        created += 1;
      }
      continue;
    }

    const [deckCountSnapshot, collectionCountSnapshot] = await Promise.all([
      userDocument.ref.collection("decks").count().get(),
      userDocument.ref.collection("collection").count().get(),
    ]);

    try {
      const didCreate = await firestore.runTransaction(async (transaction) => {
        const [profile, reservation] = await Promise.all([
          transaction.get(profileRef),
          transaction.get(usernameRef),
        ]);
        if (profile.exists) {
          transaction.set(
            profileRef,
            {
              displayNameNormalized: normalizeSearchText(
                String(profile.get("displayName") ?? username),
              ),
            },
            { merge: true },
          );
          return false;
        }
        const reservedUserId = reservation.get("userId") ?? reservation.get("uid");
        if (reservation.exists && reservedUserId !== userDocument.id) {
          throw new Error("USERNAME_CONFLICT");
        }
        transaction.create(profileRef, {
          username,
          usernameNormalized,
          displayName: String(data.displayName ?? username),
          displayNameNormalized: normalizeSearchText(
            String(data.displayName ?? username),
          ),
          bio: "",
          joinedAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          updatedAt: FieldValue.serverTimestamp(),
          stats: {
            followersCount: 0,
            followingCount: 0,
            decksCount: deckCountSnapshot.data().count,
            collectionCardsCount: collectionCountSnapshot.data().count,
          },
          visibility: {
            publicProfile: true,
            decks: "public",
            collection: "private",
            activity: "public",
          },
        });
        transaction.set(
          usernameRef,
          {
            userId: userDocument.id,
            username,
            currentUsernameNormalized: usernameNormalized,
            isAlias: false,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        transaction.set(
          userDocument.ref,
          {
            username,
            usernameNormalized,
            pseudonym: username,
            pseudonymKey: usernameNormalized,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        return true;
      });
      if (didCreate) created += 1;
      else skipped += 1;
    } catch (error) {
      if (error instanceof Error && error.message === "USERNAME_CONFLICT") {
        conflicts.push(`${userDocument.id}: @${usernameNormalized}`);
        continue;
      }
      throw error;
    }
  }

  console.info(
    `${isDryRun ? "Would create" : "Created"} ${created} public profile(s); skipped ${skipped}.`,
  );
  if (conflicts.length > 0) {
    console.warn(`Username conflicts (${conflicts.length}):\n${conflicts.join("\n")}`);
    process.exitCode = 2;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
