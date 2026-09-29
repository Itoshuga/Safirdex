import { loadEnvConfig } from "@next/env";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

loadEnvConfig(process.cwd());

const apply = process.argv.includes("--apply");
const allowLiveProject = process.argv.includes("--allow-live");
const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

async function main() {
  if (apply && !isEmulator && !allowLiveProject) {
    throw new Error("Refusing to migrate a live Firebase project. Pass --allow-live explicitly.");
  }
  const { getFirebaseAdminFirestore } = await import("@/lib/firebase/admin");
  const firestore = getFirebaseAdminFirestore();
  const [users, cards] = await Promise.all([
    firestore.collection("users").get(),
    firestore.collection("cards").select("gameplayKind").get(),
  ]);
  const collectibleCards = new Set(
    cards.docs.filter((card) => card.get("gameplayKind") !== "token").map((card) => card.id),
  );
  let entries = 0;
  let usersWithCollection = 0;

  for (const user of users.docs) {
    const snapshot = await user.ref.collection("collection").get();
    if (snapshot.empty) continue;
    usersWithCollection += 1;
    const normalized = snapshot.docs.flatMap((document) => {
      const ownedQuantity = Math.min(999, Math.max(0, Math.trunc(Number(document.get("ownedQuantity") ?? document.get("quantity") ?? 0))));
      const tradeQuantity = Math.min(Math.max(ownedQuantity - 1, 0), Math.max(0, Math.trunc(Number(document.get("tradeQuantity") ?? 0))));
      return ownedQuantity > 0 && collectibleCards.has(document.id)
        ? [{ document, ownedQuantity, tradeQuantity }]
        : [];
    });
    entries += normalized.length;
    if (!apply) continue;

    for (let index = 0; index < snapshot.docs.length; index += 400) {
      const batch = firestore.batch();
      for (const document of snapshot.docs.slice(index, index + 400)) {
        const value = normalized.find((entry) => entry.document.id === document.id);
        if (!value) {
          batch.delete(document.ref);
          continue;
        }
        batch.set(document.ref, {
          cardId: document.id,
          ownedQuantity: value.ownedQuantity,
          tradeQuantity: value.tradeQuantity,
          addedAt: document.get("addedAt") ?? document.get("createdAt") ?? Timestamp.now(),
          updatedAt: document.get("updatedAt") ?? Timestamp.now(),
          quantity: FieldValue.delete(),
          isFavorite: FieldValue.delete(),
          createdAt: FieldValue.delete(),
        }, { merge: true });
      }
      await batch.commit();
    }

    const totalOwnedCopies = normalized.reduce((total, entry) => total + entry.ownedQuantity, 0);
    const duplicateCopies = normalized.reduce((total, entry) => total + Math.max(entry.ownedQuantity - 1, 0), 0);
    const tradeCopies = normalized.reduce((total, entry) => total + entry.tradeQuantity, 0);
    const tradeUniqueCards = normalized.filter((entry) => entry.tradeQuantity > 0).length;
    const stats = {
      uniqueOwnedCards: normalized.length,
      totalOwnedCopies,
      duplicateCopies,
      tradeCopies,
      tradeUniqueCards,
      totalCollectibleCards: collectibleCards.size,
      completionPercentage: collectibleCards.size ? (normalized.length / collectibleCards.size) * 100 : 0,
      updatedAt: FieldValue.serverTimestamp(),
    };
    const batch = firestore.batch();
    batch.set(user.ref.collection("stats").doc("collection"), stats);
    const profileRef = firestore.collection("publicProfiles").doc(user.id);
    if ((await profileRef.get()).exists) {
      batch.set(profileRef, {
        "stats.collectionCardsCount": normalized.length,
        "stats.collectionCompletionPercentage": stats.completionPercentage,
        "stats.tradeCardsCount": tradeUniqueCards,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  }

  console.info(`${apply ? "Migrated" : "Would migrate"} ${entries} collection entries across ${usersWithCollection} users.`);
  if (!apply) console.info("Dry run only. Pass --apply (and --allow-live outside the emulator) to write changes.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
